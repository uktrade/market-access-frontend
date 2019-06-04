const backend = require( '../../../lib/backend-service' );
const metadata = require( '../../../lib/metadata' );
const Form = require( '../../../lib/Form' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );

module.exports = {
	list: async ( req, res, next ) => {

		const report = req.report;
		const reportId = report.id;
		const isPost = req.method === 'POST';

		if( !req.session.sectors ){
			req.session.sectors = ( report.sectors || [] );
		}

		const sectors = req.session.sectors;

		if( isPost && sectors && sectors.length ){

			try {

				delete req.session.sectors;

				const { response } = await backend.reports.saveSectors( req, reportId, { sectors } );

				if( response.isSuccess ){

					const isExit = ( req.body.action === 'exit' );
					return res.redirect( isExit ? urls.reports.detail( reportId ) : urls.reports.aboutProblem( reportId ) );

				} else {

					return next( new Error( `Unable to update report, got ${ response.statusCode } response code` ) );
				}

			} catch( e ){

				return next( e );
			}
		}

		res.render( 'reports/views/sectors', { sectors: sectors.map( metadata.getSector ), csrfToken: req.csrfToken() } );
	},

	remove: ( req, res ) => {

		const sectorToRemove = req.body.sector;

		req.session.sectors = req.session.sectors.filter( ( sector ) => sector !== sectorToRemove );

		res.redirect( urls.reports.sectors( req.report.id ) );
	},

	add: ( req, res ) => {

		const report = req.report;

		if( !req.session.sectors ){

			req.session.sectors = ( report.sectors || [] );
		}

		const sectors = req.session.sectors;
		const form = new Form( req, {

			sectors: {
				type: Form.SELECT,
				items: metadata.getSectorList().filter( ( sector ) => !sectors.includes( sector.value ) ),
				validators: [ {
					fn: validators.isSector,
					message: 'Select a sector affected by the barrier'
				},{
					fn: ( value ) => !sectors.includes( value ),
					message: 'Sector already added, choose another'
				} ]
			}
		} );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				sectors.push( form.getValues().sectors );
				req.session.sectors = sectors;

				return res.redirect( urls.reports.sectors( report.id ) );
			}
		}

		res.render( 'reports/views/add-sector', Object.assign( form.getTemplateValues(), { currentSectors: sectors.map( metadata.getSector ) } ) );
	},
};
