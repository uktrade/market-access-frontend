const backend = require( '../../../lib/backend-service' );
const Form = require( '../../../lib/Form' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const metadata = require( '../../../lib/metadata' );

function renderSectors( req, res, sectors, allSectors ){
	res.render( 'barriers/views/sectors/list', { sectors: sectors.map( metadata.getSector ), allSectors, csrfToken: req.csrfToken(), } );
}

function addSectorForm( req, res, href ){

	const barrier = req.barrier;
	const sectors = req.barrierSession.sectors.list.get();
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
			req.barrierSession.sectors.list.set( sectors );
			req.barrierSession.sectors.all.set(false);

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

		req.barrierSession.sectors.all.set( req.barrier.all_sectors || false );
		req.barrierSession.sectors.list.set( req.barrier.sectors || [] );

		renderSectors( req, res, req.barrierSession.sectors.list.get(), req.barrierSession.sectors.all.get() );
	},

	list: async ( req, res, next ) => {

		const barrier = req.barrier;
		const barrierId = barrier.id;
		const isPost = req.method === 'POST';

		req.barrierSession.sectors.list.setIfNotAlready( [] );
		req.barrierSession.sectors.all.setIfNotAlready( false );

		const sectors = req.barrierSession.sectors.list.get();
		const allSectors = req.barrierSession.sectors.all.get();

		if( isPost ){

			try {

				req.barrierSession.sectors.all.delete();
				req.barrierSession.sectors.list.delete();

				const { response } = await backend.barriers.saveSectors( req, barrierId, sectors, allSectors );

				if( response.isSuccess ){

					return res.redirect( urls.barriers.detail( barrierId ) );

				} else {

					return next( new Error( `Unable to update barrier, got ${ response.statusCode } response code` ) );
				}

			} catch( e ){

				return next( e );
			}
		}

		renderSectors( req, res, sectors, allSectors );
	},

	remove: ( req, res ) => {

		const sectorToRemove = req.body.sector;
		let sectors = req.barrierSession.sectors.list.get();

		req.barrierSession.sectors.list.set( sectors.filter( ( sector ) => sector !== sectorToRemove ) );

		res.redirect( urls.barriers.sectors.list( req.barrier.id ) );
	},

	removeAllSectors: ( req, res ) => {

		req.barrierSession.sectors.all.set( false );

		res.redirect( urls.barriers.sectors.list( req.barrier.id ) );
	},

	add: ( req, res ) => {

		const barrier = req.barrier;
		const href = {
			cancel: urls.barriers.sectors.list( barrier.id ),
			form: urls.barriers.sectors.add( barrier.id )
		};

		req.barrierSession.sectors.list.setIfNotAlready([]);

		addSectorForm( req, res, href );
	},

	addAllSectors: ( req, res ) => {

		req.barrierSession.sectors.all.set( true );
		req.barrierSession.sectors.list.set( [] );

		res.redirect( urls.barriers.sectors.list( req.barrier.id ) );
	},

	new: ( req, res ) => {

		req.barrierSession.sectors.list.set( [] );
		req.barrierSession.sectors.all.set( false );

		renderSectors( req, res, [], false );
	}
};
