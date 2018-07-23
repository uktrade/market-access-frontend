const backend = require( '../../lib/backend-service' );
const Form = require( '../../lib/Form' );
const urls = require( '../../lib/urls' );
const detailVieWModel = require( './view-models/detail' );

function sortByDate( a, b ){

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

	pinned.sort( sortByDate );
	other.sort( sortByDate );

	return pinned.concat( other );
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

	barrier: ( req, res ) => res.render( 'barriers/views/detail', detailVieWModel( req.barrier ) ),

	interactions: async ( req, res, next ) => renderInteractions( req, res, next ),

	addNote: async ( req, res, next ) => {

		const barrier = req.barrier;

		const form = new Form( req, {
			_csrf: {
				values: [ req.csrfToken() ]
			},
			note: {
				required: 'Add some text for the note.'
			},
			pinned: {}
		} );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				try {

					const { response } = await backend.barriers.saveNote( req, barrier.id, form.getValues() );

					if( response.isSuccess ){

						return res.redirect( urls.barriers.interactions( barrier.id ) );

					} else {

						return next( new Error( `Unable to save barrier note, got ${ response.statusCode } from backend` ) );
					}

				} catch( e ){

					return next( e );
				}
			}
		}

		renderInteractions( req, res, next, Object.assign( {},
			{ noteForm: true },
			form.getTemplateValues()
		) );
	}
};
