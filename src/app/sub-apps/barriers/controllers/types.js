const backend = require( '../../../lib/backend-service' );
const Form = require( '../../../lib/Form' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const metadata = require( '../../../lib/metadata' );
const sortGovukItems = require( '../../../lib/sort-govuk-items' );

function barrierTypeToRadio( item ){

	const { id, title, description } = item;

	return {
		value: id,
		text: title,
		conditional: { html: `<div class="conditional-barrier-type-content">${ description.replace( '\n', '<br>' ) }</div>` }
	};
}

function renderTypes( req, res, types ){
	res.render( 'barriers/views/types/list', {
		csrfToken: req.csrfToken(),
		types: types.map( metadata.getBarrierType ).map( ( type ) => ({ name: type.title, id: type.id }) ),
	} );
}

function addTypeForm( req, res, href ){

	const barrier = req.barrier;
	const types = req.barrierSession.types.get();
	const form = new Form( req, {

		barrierType: {
			type: Form.RADIO,
			items: metadata.barrierTypes.filter( ( type ) => !types.includes( type.id ) ).map( barrierTypeToRadio ).sort( sortGovukItems.alphabetical ),
			validators: [ {
				fn: validators.isBarrierType,
				message: 'Select a barrier type'
			},{
				fn: ( value ) => !types.includes( value ),
				message: 'Barrier type already added, choose another'
			} ]
		}
	} );

	if( form.isPost ){

		form.validate();

		if( !form.hasErrors() ){

			types.push( parseInt( form.getValues().barrierType, 10 ) );
			req.barrierSession.types.set( types );

			return res.redirect( urls.barriers.types.list( barrier.id ) );
		}
	}

	res.render( 'barriers/views/types/add', {
		...form.getTemplateValues(),
		href
	} );
}

module.exports = {

	edit: ( req, res ) => {

		req.barrierSession.types.set( req.barrier.barrier_types || [] );
		renderTypes( req, res, req.barrierSession.types.get() );
	},

	list: async ( req, res, next ) => {

		const barrier = req.barrier;
		const barrierId = barrier.id;
		const isPost = req.method === 'POST';

		req.barrierSession.types.setIfNotAlready( [] );

		const types = req.barrierSession.types.get();

		if( isPost ){

			try {

				const { response } = await backend.barriers.saveTypes( req, barrierId, types );

				if( response.isSuccess ){

					req.barrierSession.types.delete();
					return res.redirect( urls.barriers.detail( barrierId ) );

				} else {

					return next( new Error( `Unable to update barrier, got ${ response.statusCode } response code` ) );
				}

			} catch( e ){

				return next( e );
			}
		}

		renderTypes( req, res, types );
	},

	remove: ( req, res ) => {

		const typeToRemove = parseInt( req.body.type, 10 );
		const types = req.barrierSession.types.get();

		req.barrierSession.types.set( types.filter( ( sector ) => sector !== typeToRemove ) );

		res.redirect( urls.barriers.types.list( req.barrier.id ) );
	},

	add: ( req, res ) => {

		const barrier = req.barrier;
		const href = {
			cancel: urls.barriers.types.list( barrier.id ),
			form: urls.barriers.types.add( barrier.id )
		};

		req.barrierSession.types.setIfNotAlready( barrier.barrier_types || [] );

		addTypeForm( req, res, href );
	},

	new: ( req, res ) => {

		const barrier = req.barrier;
		const href = {
			cancel: urls.barriers.detail( barrier.id ),
			form: urls.barriers.types.new( barrier.id )
		};

		req.barrierSession.types.set( [] );

		addTypeForm( req, res, href );
	}
};
