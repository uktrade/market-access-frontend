const config = require( '../../../config' );
const metadata = require( '../../../lib/metadata' );
const reporter = require( '../../../lib/reporter' );
const backend = require( '../../../lib/backend-service' );
const Form = require( '../../../lib/Form' );
const FormProcessor = require( '../../../lib/FormProcessor' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const fileSize = require( '../../../lib/file-size' );
const uploadDocument = require( '../../../lib/upload-document' );
const detailVieWModel = require( '../view-models/detail' );
const interactionsViewModel = require( '../view-models/interactions' );

const MAX_FILE_SIZE = fileSize( config.files.maxSize );
const OVERSIZE_FILE_MESSAGE = `File size exceeds the ${ MAX_FILE_SIZE } limit. Reduce file size and upload the document again.`;
const NOTE_ERROR = 'Add text for the note.';
const INVALID_FILE_TYPE_MESSAGE = `Unsupported file format. The following file formats are accepted ${ getValidTypes() }`;

function getValidTypes(){

	const types = [];

	config.files.types.forEach( ( type ) => {

		const file = metadata.mimeTypes[ type ];

		if( file ){ types.push( file ); return; }

		reporter.message( 'info', 'No file extension mapping found for valid type: ' + type );

		types.push( type );
	} );

	return types.join( ', ' );
}

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

function isFileOverSize( err ){

	const message = err.message;
	const isOverSize = ( message.indexOf( 'maxFileSize exceeded' ) >= 0 );

	if( isOverSize ){
		reporter.message( 'info', err.message );
	}

	return isOverSize;
}

function reportInvalidFile( file ){
	reporter.message( 'info', 'Invalid document type: ' + file.type, { size: file.size, name: file.name } );
}

async function handleNoteForm( req, res, next, opts ){

	const barrier = req.barrier;
	const form = new Form( req, {
		note: {
			required: NOTE_ERROR
		},
		documentIds: {},
		document: {
			type: Form.FILE,
			validators: [
				{
					fn: ( file ) => {

						const isValid = validators.isValidFile( file );

						if( !isValid ){

							reportInvalidFile( file );
						}

						return isValid;
					},
					message: INVALID_FILE_TYPE_MESSAGE
				}
			]
		}
	} );

	if( req.formError && isFileOverSize( req.formError ) ){

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

						throw new Error( 'This file may be infected with a virus and will not be accepted.' );
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

function getNoteDocumentsFromSession( req ){

	const sessionDocuments = ( req.session.noteDocuments || [] );

	return sessionDocuments.filter( ({ noteId }) => noteId === req.note.id );
}

function removeNoteDocumentInSession( { session }, noteIdToMatch, documentIdToMatch ){

	if( session.noteDocuments ){

		session.noteDocuments = session.noteDocuments.filter( ( { noteId, document } ) => !(
			noteId === noteIdToMatch && document.id === documentIdToMatch
		) );
	}
}

function createUploadHandler( passedCb ){
	return async ( req, res ) => {

		const document = req.body.document;

		if( req.formError ){

			res.status( 400 );
			res.json( { message: ( isFileOverSize( req.formError ) ? OVERSIZE_FILE_MESSAGE : '' ) } );

		} else if( document && validators.isValidFile( document ) ){

			try {

				const documentId = await uploadDocument( req, document );
				const { passed } = await backend.documents.getScanStatus( req, documentId );

				if( passed ){

					passedCb( req, {
						id: documentId,
						size: fileSize( document.size ),
						name: document.name,
					} );

					res.json( {
						documentId,
						file: { name: document.name, size: fileSize( document.size ) },
					} );

				} else {

					res.status( 401 );
					res.json( { message: 'This file may be infected with a virus and will not be accepted.' } );
				}

			} catch( e ){

				res.status( 500 );
				res.json( { message: 'A system error has occured, so the file has not been uploaded. Try again.' } );
				reporter.captureException( e );
			}

		} else {

			res.status( 400 );
			res.json( { message: INVALID_FILE_TYPE_MESSAGE } );
			reportInvalidFile( document );
		}
	};
}

module.exports = {

	list: async ( req, res, next ) => await renderInteractions( req, res, next ),

	documents: {
		add: createUploadHandler( ( req, document ) => {

			req.session.barrierDocuments = req.session.barrierDocuments || [];
			req.session.barrierDocuments.push( { barrierId: req.uuid, document } );
		} ),

		delete: async ( req, res ) => {

			const { uuid: barrierId } = req;
			const { id: documentId } = req.params;

			try {

				if( !validators.isUuid( documentId ) ){ throw new Error( 'Invalid documentId' ); }

				const { response } = await backend.documents.delete( req, documentId );

				if( response.isSuccess || response.statusCode === 404 ){

					removeBarrierDocumentInSession( req, barrierId, documentId );
					res.status( 200 );
					res.json( {} );

				} else {

					res.status( 500 );
					res.json( { message: 'A system error has occured, so the file has not been deleted. Try again.' } );
					reporter.captureException( new Error( `Unable to delete document ${ documentId }, got ${ response.statusCode } from backend` ) );
				}

			} catch ( e ){

				res.status( 500 );
				res.json( {} );
				reporter.captureException( e );
			}
		}
	},

	notes: {
		documents: {
			add: createUploadHandler( ( req, document ) => {

				req.session.noteDocuments = req.session.noteDocuments || [];
				req.session.noteDocuments.push( { noteId: req.note.id, document } );
			} ),
			delete: async ( req, res, next ) => {

				const { uuid: barrierId, note } = req;
				const documentId = req.document.id;
				const isJson = req.method === 'POST';

				try {

					const { response } = await backend.documents.delete( req, documentId );

					if( response.isSuccess || response.statusCode === 400 ){

						removeNoteDocumentInSession( req, note.id, documentId );

						if( isJson ){

							res.json( {} );

						} else {

							res.redirect( urls.barriers.notes.edit( barrierId, note.id ) );
						}

					} else {

						throw new Error( `Unable to delete document ${ documentId }, got ${ response.statusCode } from backend` );
					}

				} catch ( e ){

					if( isJson ){

						res.status( 500 );
						res.json( { message: 'Error deleteing file' } );
						reporter.captureException( e );

					} else {

						next( e );
					}
				}
			},
		},

		add: async ( req, res, next ) => {

			try {

				await handleNoteForm( req, res, next, {

					getDocuments: () => getBarrierDocumentsFromSession( req ).map( ({ document }) => document ),
					getDocumentIds: () => getBarrierDocumentsFromSession( req ).map( ({ document }) => document.id ),
					clearSessionDocuments: () => {

						if( req.session.barrierDocuments ){

							req.session.barrierDocuments = req.session.barrierDocuments.filter( ({ barrierId }) => (
								barrierId !== req.barrier.id
							) );
						}
					},

					data: {
						showNoteForm: true,
					},

					saveFormData: async ( values ) => backend.barriers.notes.save( req, req.barrier.id, values ),
				} );

			} catch( e ){

				next( e );
			}
		},

		edit: async ( req, res, next ) => {

			const note = req.note;
			const getDocumentIds = () => getNoteDocumentsFromSession( req ).map( ({ document }) => document.id );

			if( req.method === 'GET' ){

				req.session.noteDocuments = ( req.session.noteDocuments || [] );

				if( note.documents ){

					const docIdsInSession = getDocumentIds();
					const notAlreadyInSession = note.documents.filter( ( document ) => !docIdsInSession.includes( document.id ) );

					if( notAlreadyInSession.length ){

						req.session.noteDocuments = req.session.noteDocuments.concat( note.documents.map( ( document ) => ({
							noteId: note.id,
							document: {
								id: document.id,
								name: document.name,
								size: fileSize( document.size ),
							}
						}) ) );
					}
				}
			}

			try {

				await handleNoteForm( req, res, next, {

					editId: note.id,
					getDocuments: () => getNoteDocumentsFromSession( req ).map( ({ document }) => document ),
					getDocumentIds,
					clearSessionDocuments: () => {

						if( req.session.noteDocuments ){

							req.session.noteDocuments = req.session.noteDocuments.filter( ( { noteId } ) => noteId !== note.id );
						}
					},
					saveFormData: ( values ) => backend.barriers.notes.update( req, note.id, values ),
				} );

			} catch( e ){

				next( e );
			}
		}
	},
};
