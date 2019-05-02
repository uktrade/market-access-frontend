const backend = require( '../../../lib/backend-service' );
const Form = require( '../../../lib/Form' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const metadata = require( '../../../lib/metadata' );

function renderSectors( req, res, sectors ){
	let sectorsList = req.barrier.all_sectors && sectors.length === 0 ? [{name: 'All Sectors'}] : sectors.map( metadata.getSector );
	res.render( 'barriers/views/sectors/list', { sectors: sectorsList, csrfToken: req.csrfToken(), } );
}

function addSectorForm( req, res, href ){

	const barrier = req.barrier;
	const sectors = req.session.barrierSectors;
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
			req.session.barrierSectors = sectors;

			return res.redirect( urls.barriers.sectors.list( barrier.id ) );
		}
	}

	res.render( 'barriers/views/sectors/add', Object.assign(
		form.getTemplateValues(),
		{ currentSectors: sectors.map( metadata.getSector ) },
		{ href }
	) );
}

module.exports = {

	edit: ( req, res ) => {

		req.session.barrierSectors = ( req.barrier.sectors || [] );
		renderSectors( req, res, req.session.barrierSectors );
	},

	list: async ( req, res, next ) => {

		const barrier = req.barrier;
		const barrierId = barrier.id;
		const isPost = req.method === 'POST';

		if( !req.session.barrierSectors ){
			req.session.barrierSectors = ( barrier.sectors || [] );
		}

		const sectors = req.session.barrierSectors;

		if( isPost ){

			try {

				delete req.session.barrierSectors;

				const { response } = await backend.barriers.saveSectors( req, barrierId, sectors );

				if( response.isSuccess ){

					return res.redirect( urls.barriers.detail( barrierId ) );

				} else {

					return next( new Error( `Unable to update barrier, got ${ response.statusCode } response code` ) );
				}

			} catch( e ){

				return next( e );
			}
		}

		renderSectors( req, res, sectors );
	},

	remove: ( req, res ) => {

		const sectorToRemove = req.body.sector;

		req.session.barrierSectors = req.session.barrierSectors.filter( ( sector ) => sector !== sectorToRemove );

		res.redirect( urls.barriers.sectors.list( req.barrier.id ) );
	},

	add: ( req, res ) => {

		const barrier = req.barrier;
		const href = {
			cancel: urls.barriers.sectors.list( barrier.id ),
			form: urls.barriers.sectors.add( barrier.id )
		};

		if( !req.session.barrierSectors ){

			req.session.barrierSectors = ( barrier.sectors || [] );
		}

		addSectorForm( req, res, href );
	},

	new: ( req, res ) => {

		const barrier = req.barrier;
		const href = {
			cancel: urls.barriers.detail( barrier.id ),
			form: urls.barriers.sectors.new( barrier.id )
		};

		req.session.barrierSectors = [];

		addSectorForm( req, res, href );
	}
};
