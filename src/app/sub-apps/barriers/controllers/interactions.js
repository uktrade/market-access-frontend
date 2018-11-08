const backend = require( '../../../lib/backend-service' );
const Form = require( '../../../lib/Form' );
const FormProcessor = require( '../../../lib/FormProcessor' );
const urls = require( '../../../lib/urls' );
const detailVieWModel = require( '../view-models/detail' );

function sortByDateDescending( a, b ){

	const aDate = Date.parse( a.created_on );
	const bDate = Date.parse( b.created_on );

	return ( aDate === bDate ? 0 : ( aDate > bDate ? -1 : 1 ) );
}

function getInteractionsList( interactions ){

	const pinned = [];
	const other = [];

	for( let item of interactions ){

		if( !item.text ){ continue; }

		if( item.pinned ){
			pinned.push( item );
		} else {
			other.push( item );
		}
	}

	//pinned.sort( sortByDateDescending );
	//other.sort( sortByDateDescending );
	//return pinned.concat( other );

	return pinned.concat( other ).sort( sortByDateDescending );
}

async function renderInteractions( req, res, next, data ){

	try {

		const { response, body } = await backend.barriers.getInteractions( req, req.barrier.id );

		if( response.isSuccess ){

			res.render( 'barriers/views/interactions', Object.assign(
				detailVieWModel( req.barrier ),
				{ interactions: getInteractionsList( body.results ) },
				data
			) );

		} else {

			next( new Error( `Unable to get interactions, got ${ response.statusCode } response from backend` ) );
		}

	} catch( e ){

		next( e );
	}
}

module.exports = {

	list: async ( req, res, next ) => renderInteractions( req, res, next ),

	addNote: async ( req, res, next ) => {

		const barrier = req.barrier;

		const form = new Form( req, {
			note: {
				required: 'Add some text for the note.'
			},
			pinned: {}
		} );

		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => renderInteractions( req, res, next, Object.assign( {},
				{ noteForm: true },
				templateValues
			) ),
			saveFormData: ( formValues ) => backend.barriers.saveNote( req, barrier.id, formValues ),
			saved: () => res.redirect( urls.barriers.interactions( barrier.id ) )
		} );

		try {

			await processor.process();

		} catch( e ){

			next( e );
		}
	},
};
