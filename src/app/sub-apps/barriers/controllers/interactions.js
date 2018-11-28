const config = require( '../../../config' );
const backend = require( '../../../lib/backend-service' );
const uploadFile = require( '../../../lib/upload-file' );
const Form = require( '../../../lib/Form' );
const FormProcessor = require( '../../../lib/FormProcessor' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const fileSize = require( '../../../lib/file-size' );
const detailVieWModel = require( '../view-models/detail' );
const interactionsViewModel = require( '../view-models/interactions' );

const SCAN_CHECK_INTERVAL = config.files.scan.statusCheckInterval;
const SCAN_MAX_ATTEMPTS = Math.round( config.files.scan.maxWaitTime / SCAN_CHECK_INTERVAL );

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

function checkScanStatus( req, documentId ){

	return new Promise( ( resolve, reject ) => {

		let attempts = 0;
		const interval = setInterval( async () => {

			attempts++;

			if( attempts > SCAN_MAX_ATTEMPTS ){

				clearInterval( interval );
				return reject( new Error( 'Virus scan took too long' ) );
			}

			try {

				const { response, body } = await backend.documents.getStatus( req, documentId );

				if( response.isSuccess ){

					const { status } = body;
					const passed = ( status === 'virus_scanned' );

					if( passed || status === 'virus_scanning_failed' ){

						clearInterval( interval );
						resolve( { status, passed } );
					}

				} else {

					reject( new Error( 'Not a successful response from the backend, got ' + response.statusCode ) );
				}

			} catch( e ){

				clearInterval( interval );
				reject( e );
			}

		}, SCAN_CHECK_INTERVAL );
	} );
}

function uploadDocument( req, file ) {

	return new Promise( async ( resolve, reject ) => {

		const { response, body } = await backend.documents.create( req, file.name );

		if( response.isSuccess ){

			const { id, signed_upload_url } = body;

			uploadFile( signed_upload_url, file ).then( async ( { response, body } ) => {

				if( response.statusCode === 200 ){

					const { response } = await backend.documents.uploadComplete( req, id );

					if( response.isSuccess ){

						try {

							resolve( id );

						} catch( e ){

							reject( e );
						}
					}

				} else {

					console.log( 'Response from S3 upload:' );
					console.log( response.statusCode );
					console.log( body );
					reject( new Error( 'Unable to upload to S3' ) );
				}

			} ).catch( reject );

		} else {

			reject( new Error( 'Could not create document' ) );
		}
	} );
}

function getUploadedDocuments( sessionDocuments, id ){

	const uploadedDocuments = ( sessionDocuments || [] );

	return uploadedDocuments.filter( ( { barrierId } ) => barrierId === id ).map( ( { documentId } ) => documentId );
}

module.exports = {

	list: async ( req, res, next ) => await renderInteractions( req, res, next ),

	notes: {
		documents: {
			add: async ( req, res ) => {

				const barrierId = req.uuid;
				const document = req.body.document;

				function sendJson( data ){

					res.json( {
						...data,
						csrfToken: req.csrfToken(),
					} );
				}

				if( document && validators.isValidFile( document ) ){

					try {

						const documentId = await uploadDocument( req, document );

						req.session.barrierDocuments = req.session.barrierDocuments || [];
						req.session.barrierDocuments.push( { barrierId, documentId } );

						sendJson( {
							documentId,
							file: { name: document.name, size: fileSize( document.size ) },
							checkUrl: urls.barriers.documents.checkStatus( documentId ),
						} );

					} catch( e ){

						res.status( 500 );
						sendJson( { message: e.message } );
					}

				} else {

					res.status( 400 );
					sendJson( { message: 'Invalid document' } );
				}
			},

			checkScanStatus: async ( req, res ) => {

				const documentId = req.uuid;

				try {

					res.json( await checkScanStatus( req, documentId ) );

				} catch( e ){

					res.status( 500 );
					res.json( { message: e.message } );
				}
			},
		},

		add: async ( req, res, next ) => {

			const barrier = req.barrier;
			const form = new Form( req, {
				note: {
					required: 'Add some text for the note.'
				},
				pinned: {},
				documentId: {
					values: getUploadedDocuments( req.session.barrierDocuments, req.barrier.id )
				},
				document: {
					type: Form.FILE,
					validators: [
						{
							fn: validators.isValidFile,
							message: 'This type of document is not supported'
						}
					]
				}
			} );

			const processor = new FormProcessor( {
				form,
				render: async ( templateValues ) => await renderInteractions( req, res, next, {
					data: Object.assign(	{ noteForm: true }, templateValues )
				} ),
				saveFormData: async ( formValues ) => {

					const values = {
						note: formValues.note,
						pinned: formValues.pinned,
					};

					if( formValues.documentId ){

						values.documentId = formValues.documentId;

						if( req.session.barrierDocuments ){

							req.session.barrierDocuments = req.session.barrierDocuments.filter( ( { barrierId, documentId } ) => (
								barrierId === req.barrier.id && documentId === formValues.documentId
							) );
						}

					} else if( formValues.document ){

						try {

							const id = await uploadDocument( req, formValues.document );
							values.documentId = id;
							await checkScanStatus( req, id );

						} catch ( e ){

							return next( e );
						}
					}

					return backend.barriers.notes.save( req, barrier.id, values );
				},
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
