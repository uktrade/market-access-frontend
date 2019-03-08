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

function getUploadedDocuments( sessionDocuments, id ){

	const uploadedDocuments = ( sessionDocuments || [] );

	return uploadedDocuments.filter( ( { barrierId } ) => barrierId === id ).map( ( { documentId } ) => documentId );
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

module.exports = {

	list: async ( req, res, next ) => await renderInteractions( req, res, next ),

	notes: {
		documents: {
			add: async ( req, res ) => {

				const barrierId = req.uuid;
				const document = req.body.document;

				function sendJson( data ){

					res.json( data );
				}

				if( req.formError ){

					res.status( 400 );
					sendJson( { message: ( isFileOverSize( req.formError ) ? OVERSIZE_FILE_MESSAGE : '' ) } );

				} else if( document && validators.isValidFile( document ) ){

					try {

						const documentId = await uploadDocument( req, document );

						req.session.barrierDocuments = req.session.barrierDocuments || [];
						req.session.barrierDocuments.push( { barrierId, documentId } );

						sendJson( {
							documentId,
							file: { name: document.name, size: fileSize( document.size ) },
							checkUrl: urls.documents.getScanStatus( documentId ),
						} );

					} catch( e ){

						res.status( 500 );
						sendJson( { message: 'A system error has occured, so the file has not been uploaded. Try again.' } );
					}

				} else {

					res.status( 400 );
					sendJson( { message: INVALID_FILE_TYPE_MESSAGE } );
					reportInvalidFile( document );
				}
			},

			deleteConfirmation: ( req, res ) => {

				const note = req.note;
				const document = req.document;

				res.render( 'barriers/views/delete-document', { note, document, csrfToken: req.csrfToken() } );
			},

			delete: async ( req, res, next ) => {

				const { uuid: barrierId, note } = req;
				const documentId = req.document.id;

				try {

					const { response } = await backend.documents.delete( req, documentId );

					if( response.isSuccess ){

						res.redirect( urls.barriers.notes.edit( barrierId, note.id ) );

					} else {

						throw new Error( `Unable to delete document ${ documentId }, got ${ response.statusCode } from backend` );
					}

				} catch ( e ){ next( e ); }
			},
		},

		add: async ( req, res, next ) => {

			const barrier = req.barrier;
			const form = new Form( req, {
				note: {
					required: NOTE_ERROR
				},
				pinned: {},
				documentId: {
					values: getUploadedDocuments( req.session.barrierDocuments, req.barrier.id )
				},
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
					data: Object.assign(	{ noteForm: true, noteErrorText: NOTE_ERROR }, templateValues )
				} ),
				saveFormData: async ( formValues ) => {

					const values = {
						note: formValues.note,
						pinned: formValues.pinned,
					};

					if( formValues.documentId ){

						values.documentId = formValues.documentId;

					} else if( formValues.document && formValues.document.size > 0 ){

						try {

							const id = await uploadDocument( req, formValues.document );
							values.documentId = id;
							const { passed } = await backend.documents.getScanStatus( req, id );

							if( !passed ){

								throw new Error( 'This file may be infected with a virus and will not be accepted.' );
							}

						} catch ( e ){

							return next( e );
						}
					}

					return backend.barriers.notes.save( req, barrier.id, values );
				},
				saved: () => {

					if( req.session.barrierDocuments ){

						req.session.barrierDocuments = req.session.barrierDocuments.filter( ( { barrierId } ) => (
							barrierId !== barrier.id
						) );
					}

					res.redirect( urls.barriers.detail( barrier.id ) );
				}
			} );

			try {

				await processor.process();

			} catch( e ){

				next( e );
			}
		},

		edit: async ( req, res, next ) => {

			const barrier = req.barrier;
			const noteId = req.params.id;
			const noteIdIsNumeric = ( !!noteId && validators.isNumeric( noteId ) );

			if( noteIdIsNumeric ){

				const form = new Form( req, {
					note: {
						required: 'Add text for the note.'
					}
				} );

				const processor = new FormProcessor( {
					form,
					render: async ( templateValues ) => await renderInteractions( req, res, next, {
						editId: noteId,
						data: templateValues
					} ),
					saveFormData: ( formValues ) => backend.barriers.notes.update( req, noteId, formValues ),
					saved: () => res.redirect( urls.barriers.detail( barrier.id ) )
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
