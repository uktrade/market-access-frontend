const backend = require( '../../../lib/backend-service' );
const Form = require( '../../../lib/Form' );
const FormProcessor = require( '../../../lib/FormProcessor' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const detailVieWModel = require( '../view-models/detail' );
const interactionsViewModel = require( '../view-models/interactions' );

function getTimelineData( req, barrierId ){

	return new Promise( async ( resolve, reject ) => {

		try {


			const [ interactions, statusHistory ] = await Promise.all( [
				backend.barriers.getInteractions( req, barrierId ),
				backend.barriers.getStatusHistory( req, barrierId )
			]);

			if( interactions.response.isSuccess && statusHistory.response.isSuccess ){

				resolve( {
					interactions: interactions.body,
					statusHistory: statusHistory.body
				} );

			} else {

				reject( new Error( `Unable to get interactions and statusHistory, got ${ interactions.response.statusCode } from interactions and ${ statusHistory.response.statusCode } from statusHistory` ) );
			}

		} catch( e ){

			reject( e );
		}
	} );
}

async function renderInteractions( req, res, next, opts = {} ){

	try {

		res.render( 'barriers/views/interactions', Object.assign(
			detailVieWModel( req.barrier ),
			{ interactions: interactionsViewModel( await getTimelineData( req, req.barrier.id ), opts.editId ) },
			opts.data
		) );

	} catch( e ){

		next( e );
	}
}

module.exports = {

	list: async ( req, res, next ) => await renderInteractions( req, res, next ),

	notes: {

		add: async ( req, res, next ) => {

			const barrier = req.barrier;

			const form = new Form( req, {
				note: {
					required: 'Add some text for the note.'
				},
				pinned: {}
			} );

			const processor = new FormProcessor( {
				form,
				render: async ( templateValues ) => await renderInteractions( req, res, next, {
					data: Object.assign(	{ noteForm: true }, templateValues )
				} ),
				saveFormData: ( formValues ) => backend.barriers.notes.save( req, barrier.id, formValues ),
				saved: () => res.redirect( urls.barriers.interactions( barrier.id ) )
			} );

			try {

				await processor.process();

			} catch( e ){

				next( e );
			}
		},

		edit: async ( req, res, next ) => {

			const barrier = req.barrier;
			const noteId = req.params.noteId;
			const noteIdIsNumeric = ( !!noteId && validators.isNumeric( noteId ) );

			if( noteIdIsNumeric ){

				const form = new Form( req, {
					note: {
						required: 'Add some text for the note.'
					}
				} );

				const processor = new FormProcessor( {
					form,
					render: async ( templateValues ) => await renderInteractions( req, res, next, {
						editId: noteId,
						data: templateValues
					} ),
					saveFormData: ( formValues ) => backend.barriers.notes.update( req, noteId, formValues ),
					saved: () => res.redirect( urls.barriers.interactions( barrier.id ) )
				} );

				try {

					await processor.process();

				} catch( e ){

					next( e );
				}

			} else {

				next( new Error( 'Invalid noteId' ) );
			}
		}
	},
};
