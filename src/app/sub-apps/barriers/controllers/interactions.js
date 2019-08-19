const config = require( '../../../config' );
const backend = require( '../../../lib/backend-service' );
const Form = require( '../../../lib/Form' );
const FormProcessor = require( '../../../lib/FormProcessor' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const fileSize = require( '../../../lib/file-size' );
const uploadDocument = require( '../../../lib/upload-document' );
const detailVieWModel = require( '../view-models/detail' );
const interactionsViewModel = require( '../view-models/interactions' );
const documentControllers = require( '../../../lib/document-controllers' );

const NOTE_ERROR = 'Add text for the note.';
const { OVERSIZE_FILE_MESSAGE, INVALID_FILE_TYPE_MESSAGE, FILE_INFECTED_MESSAGE } = documentControllers;

function getTimelineData( req, barrierId ){

	return new Promise( async ( resolve, reject ) => {

		try {

			const [ interactions, history ] = await Promise.all( [
				backend.barriers.getInteractions( req, barrierId ),
				backend.barriers.getHistory( req, barrierId )
			]);

			if( interactions.response.isSuccess && history.response.isSuccess ){

				resolve( {
					interactions: interactions.body,
					history: history.body
				} );

			} else {

				reject( new Error( `Unable to get interactions and history, got ${ interactions.response.statusCode } from interactions and ${ history.response.statusCode } from history` ) );
			}

		} catch( e ){

			reject( e );
		}
	} );
}

async function renderInteractions( req, res, next, opts = {} ){

	const addCompany = ( config.addCompany || !!req.query.addCompany );
	const createdFlash = req.flash( 'barrier-created' );
	const isNew = createdFlash && createdFlash.length === 1;

	if( isNew ){

		res.locals.toast = {
			heading: 'Barrier added to the service',
			message: 'Continue to add more detail to your barrier'
		};
	}

	try {

		res.render( 'barriers/views/detail', Object.assign(
			detailVieWModel( req.barrier, addCompany ),
			{ interactions: interactionsViewModel( await getTimelineData( req, req.barrier.id ), opts.editId ) },
			opts.data
		) );

	} catch( e ){

		next( e );
	}
}

async function handleNoteForm( req, res, next, opts ){

	const barrier = req.barrier;
	const form = new Form( req, {
		note: {
			required: NOTE_ERROR
		},
		document: {
			type: Form.FILE,
			validators: [
				{
					fn: ( file ) => {

						const isValid = validators.isValidFile( file );

						if( !isValid ){

							documentControllers.reportInvalidFile( file );
						}

						return isValid;
					},
					message: INVALID_FILE_TYPE_MESSAGE
				}
			]
		}
	} );

	if( req.formError && validators.isFileOverSize( req.formError ) ){

		form.addErrors( { document: OVERSIZE_FILE_MESSAGE } );
	}

	const processor = new FormProcessor( {
		form,
		render: async ( templateValues ) => await renderInteractions( req, res, next, {
			editId: opts.editId,
			data: {
				...templateValues,
				...opts.data,
				documents: opts.getDocuments(),
				noteErrorText: NOTE_ERROR
			},
		} ),
		saveFormData: async ( formValues ) => {

			const values = {
				note: formValues.note,
				documentIds: ( opts.getDocumentIds() || [] ),
			};

			if( formValues.document && formValues.document.size > 0 ){

				try {

					const id = await uploadDocument( req, formValues.document );
					const { passed } = await backend.documents.getScanStatus( req, id );

					if( passed ){

						values.documentIds.push( id );

					} else {

						throw new Error( FILE_INFECTED_MESSAGE );
					}

				} catch ( e ){

					return next( e );
				}
			}

			return opts.saveFormData( values );
		},
		saved: () => {

			opts.clearSessionDocuments();
			res.redirect( urls.barriers.detail( barrier.id ) );
		}
	} );

	try {

		await processor.process();

	} catch( e ){

		next( e );
	}
}

function getBarrierDocumentsFromSession( req ){

	const sessionDocuments = ( req.session.barrierDocuments || [] );

	return sessionDocuments.filter( ( { barrierId } ) => barrierId === req.barrier.id );
}

function removeBarrierDocumentInSession( { session }, barrierIdToMatch, documentIdToMatch ){

	if( session.barrierDocuments ){

		session.barrierDocuments = session.barrierDocuments.filter( ( { barrierId, document } ) => !(
			barrierId === barrierIdToMatch && document.id === documentIdToMatch
		) );
	}
}

function removeAllBarrierDocumentsInSession( { session }, barrierIdToMatch ){

	if( session.barrierDocuments ){

		session.barrierDocuments = session.barrierDocuments.filter( ( { barrierId } ) => !(
			barrierId === barrierIdToMatch
		) );
	}
}

function getNoteDocumentsFromSession( req ){

	const sessionDocuments = ( req.session.noteDocuments || {} );

	return sessionDocuments[ req.note.id ] || [];
}

function removeNoteDocumentInSession( { session }, noteIdToMatch, documentIdToMatch ){

	if( session.noteDocuments && session.noteDocuments[ noteIdToMatch ] ){

		session.noteDocuments[ noteIdToMatch ] = session.noteDocuments[ noteIdToMatch ].filter( ( { document } ) => document.id !== documentIdToMatch );
	}
}

function removeAllNoteDocumentsInSession( { session }, noteIdToMatch ){

	if( session.noteDocuments && session.noteDocuments[ noteIdToMatch ] ){

		delete session.noteDocuments[ noteIdToMatch ];
	}
}

module.exports = {

	list: renderInteractions,

	documents: {
		add: documentControllers.xhr.add( ( req, document ) => {

			req.session.barrierDocuments = req.session.barrierDocuments || [];
			req.session.barrierDocuments.push( { barrierId: req.uuid, document } );
		} ),

		delete: documentControllers.xhr.delete( ( req ) => req.params.id, ( req, documentId ) => {

			removeBarrierDocumentInSession( req, req.uuid, documentId );
		} ),

		cancel: ( req, res ) => {

			const barrierId = req.uuid;

			removeAllBarrierDocumentsInSession( req, barrierId );
			res.redirect( urls.barriers.detail( barrierId ) );
		}
	},

	notes: {
		documents: {
			add: documentControllers.xhr.add( ( req, document ) => {

				const noteId = req.note.id;

				req.session.noteDocuments = req.session.noteDocuments || {};
				req.session.noteDocuments[ noteId ] = req.session.noteDocuments[ noteId ] || [];
				req.session.noteDocuments[ noteId ].push( { document } );
			} ),
			delete: documentControllers.delete(
				( req ) => req.params.id,
				( req ) => urls.barriers.notes.edit( req.uuid, req.note.id ),
				( req, documentId ) => removeNoteDocumentInSession( req, req.note.id, documentId ),
			),
			cancel: ( req, res ) => {

				removeAllNoteDocumentsInSession( req, req.note.id );
				res.redirect( urls.barriers.detail( req.uuid ) );
			}
		},

		add: ( req, res, next ) => {

			handleNoteForm( req, res, next, {

				data: {
					showNoteForm: true,
					pageTitleSuffix: ' - Add a note'
				},
				getDocuments: () => getBarrierDocumentsFromSession( req ).map( ({ document }) => document ),
				getDocumentIds: () => getBarrierDocumentsFromSession( req ).map( ({ document }) => document.id ),
				clearSessionDocuments: () => {

					removeAllBarrierDocumentsInSession( req, req.barrier.id );
				},
				saveFormData: async ( values ) => backend.barriers.notes.save( req, req.barrier.id, values ),
			} );
		},

		edit: ( req, res, next ) => {

			const note = req.note;

			req.session.noteDocuments = ( req.session.noteDocuments || {} );

			if( req.method === 'GET' && !req.session.noteDocuments[ note.id ] ){

				req.session.noteDocuments[ note.id ] = [];

				if( note.documents ){

					req.session.noteDocuments[ note.id ] = req.session.noteDocuments[ note.id ].concat( note.documents.map( ( document ) => ({
						document: {
							id: document.id,
							name: document.name,
							size: fileSize( document.size ),
						}
					}) ) );
				}
			}

			handleNoteForm( req, res, next, {

				editId: note.id,
				data: {
					pageTitleSuffix: ' - Edit a note'
				},
				getDocuments: () => getNoteDocumentsFromSession( req ).map( ({ document }) => document ),
				getDocumentIds: () => getNoteDocumentsFromSession( req ).map( ({ document }) => document.id ),
				clearSessionDocuments: () => {

					removeAllNoteDocumentsInSession( req, note.id );
				},
				saveFormData: ( values ) => backend.barriers.notes.update( req, note.id, values ),
			} );
		},

		delete: async( req, res, next ) => {

			if( req.method === 'POST' ){

				const noteId = req.note.id;
				const barrierId = req.barrier.id;

				try {

					const { response } = await backend.barriers.notes.delete( req, noteId );

					if( response.isSuccess ){

						res.redirect( urls.barriers.detail( barrierId ) );

					} else {

						next( new Error( `Could not delete note, got ${ response.statusCode } from backend` ) );
					}

				} catch( e ){

					next( e );
				}

			} else {

				if( req.xhr ){

					res.render( 'barriers/views/partials/delete-note-modal', { note: req.note, csrfToken: req.csrfToken() } );

				} else {

					await renderInteractions( req, res, next, {
						data: {
							isDelete: true,
							currentNote: req.note,
							csrfToken: req.csrfToken(),
						}
					} );
				}
			}
		}
	},
};
