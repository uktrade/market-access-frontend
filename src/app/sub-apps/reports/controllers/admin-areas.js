const backend = require( '../../../lib/backend-service' );
const metadata = require( '../../../lib/metadata' );
const Form = require( '../../../lib/Form' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const HttpResponseError = require( '../../../lib/HttpResponseError' );

module.exports = {

	list: async ( req, res, next ) => {

		const isPost = req.method === 'POST';
		const countryId = req.params.countryId;

		if( !req.session.adminAreas ){
			req.session.adminAreas = [];
		}

		const adminAreas = req.session.adminAreas;

		if( isPost ){

			try {
				const report  = ( req.report || {} );
				const sessionStartForm = ( req.session.startFormValues || req.report && { status: req.report.problem_status } );
				const sessionResolvedForm = ( req.session.isResolvedFormValues || req.report && { isResolved: req.report.is_resolved, resolvedDate: req.report.resolved_date } );
				const isUpdate = !!report.id;
				const isExit = req.body.action === 'exit';

				let response;
				let body;
				let values = Object.assign( {}, sessionStartForm, sessionResolvedForm, {country: countryId}, {adminAreas});

				if( isUpdate ){
					({ response, body } = await backend.reports.update( req, report.id, values ));
				} else {
					({ response, body } = await backend.reports.save( req, values ));
				}

				if( response.isSuccess ){

					delete req.session.startFormValues;
					delete req.session.isResolvedFormValues;
					delete req.session.adminAreas;

					if( !isUpdate && !body.id ){

						return next( new Error( 'No id created for report' ) );

					} else {

						if( isExit ){

							return res.redirect( urls.reports.detail( body.id ) );

						} else {

							return res.redirect( urls.reports.hasSectors( body.id ) );
						}
					}

				} else {

					return next( new HttpResponseError( `Unable to ${ isUpdate ? 'update' : 'save' } report`, response, body ) );
				}

			} catch( e ){
				return next( e );
			}
		}

		res.render( 'reports/views/admin-areas', { countryId, adminAreas: adminAreas.map( metadata.getAdminArea ), csrfToken: req.csrfToken() } );
	},

	remove: ( req, res ) => {

		const report  = ( req.report || {} );
		const countryId = req.params.countryId;
		const adminAreaToRemove = req.body.adminArea;

		req.session.adminAreas = req.session.adminAreas.filter( ( adminArea ) => adminArea !== adminAreaToRemove );

		res.redirect( urls.reports.adminAreas.list( report.id, countryId ) );
	},

	add: ( req, res ) => {

		const countryId = req.params.countryId;
		const report  = ( req.report || {} );

		if( !req.session.adminAreas ){
			req.session.adminAreas = [];
		}

		const adminAreas = req.session.adminAreas;
		const form = new Form( req, {

			adminAreas: {
				type: Form.SELECT,
				items: metadata.getCountryAdminAreasList(countryId).filter( ( adminArea ) => !adminAreas.includes( adminArea.value ) ),
				validators: [ {
					fn: validators.isCountryAdminArea,
					message: 'Select an admin area affected by the barrier'
				},{
					fn: ( value ) => !adminAreas.includes( value ),
					message: 'Admin area already added, choose another'
				} ]
			}
		} );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				req.session.adminAreas.push( form.getValues().adminAreas );
				return res.redirect( urls.reports.adminAreas.list( report.id, countryId ) );
			}
		}

		res.render( 'reports/views/add-admin-area', {countryId, ...form.getTemplateValues(), currentAdminAreas: adminAreas.map( metadata.getAdminArea ) } );
	},
};
