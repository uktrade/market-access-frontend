const config = require( '../config' );
const metadata = require( './metadata' );
const fileSize = require( './file-size' );
const reporter = require( './reporter' );
const validators = require( './validators' );
const uploadDocument = require( './upload-document' );
const backend = require( './backend-service' );
const HttpResponseError = require( './HttpResponseError' );

const MAX_FILE_SIZE = fileSize( config.files.maxSize );
const OVERSIZE_FILE_MESSAGE = `File size exceeds the ${ MAX_FILE_SIZE } limit. Reduce file size and upload the document again.`;
const INVALID_FILE_TYPE_MESSAGE = `Unsupported file format. The following file formats are accepted ${ getValidTypes() }`;
const UPLOAD_ERROR_MESSAGE = 'A system error has occured, so the file has not been uploaded. Try again.';
const DELETE_ERROR_MESSAGE = 'A system error has occured, so the file has not been deleted. Try again.';
const FILE_INFECTED_MESSAGE = 'This file may be infected with a virus and will not be accepted.';

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

function reportInvalidFile( file = {} ){
	reporter.message( 'info', 'Invalid document type: ' + file.type, { size: file.size, name: file.name } );
}

module.exports = {

	MAX_FILE_SIZE,
	OVERSIZE_FILE_MESSAGE,
	INVALID_FILE_TYPE_MESSAGE,
	UPLOAD_ERROR_MESSAGE,
	FILE_INFECTED_MESSAGE,

	reportInvalidFile,

	xhr: {
		add: ( passedCb ) => async ( req, res ) => {

			const document = req.body.document;

			if( req.formError ){

				const isOverSize = validators.isFileOverSize( req.formError );

				res.status( 400 );
				res.json( { message: ( isOverSize ? OVERSIZE_FILE_MESSAGE : UPLOAD_ERROR_MESSAGE ) } );

				if( !isOverSize ){

					reporter.captureException( req.formError );
				}

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
						res.json( { message: FILE_INFECTED_MESSAGE } );
					}

				} catch( e ){

					res.status( 500 );
					res.json( { message: UPLOAD_ERROR_MESSAGE } );
					reporter.captureException( e );
				}

			} else {

				res.status( 400 );
				res.json( { message: INVALID_FILE_TYPE_MESSAGE } );
				reportInvalidFile( document );
			}
		},

		delete: ( getDocumentId, successCb ) => async ( req, res ) => {

			const documentId = getDocumentId( req );

			try {

				if( !validators.isUuid( documentId ) ){ throw new Error( 'Invalid documentId' ); }

				const { response, body } = await backend.documents.delete( req, documentId );

				if( response.isSuccess || response.statusCode === 404 ){

					successCb( req, documentId );
					res.status( 200 );
					res.json( {} );

				} else {

					throw new HttpResponseError( `Unable to delete document ${ documentId }`, response, body );
				}

			} catch ( e ){

				res.status( 500 );
				res.json( { message: DELETE_ERROR_MESSAGE } );
				reporter.captureException( e );
			}
		},
	},

	delete: ( getDocumentId, getRedirectUrl, successCb ) => async ( req, res, next ) => {

		const documentId = getDocumentId( req );

		try {

			if( !validators.isUuid( documentId ) ){ throw new Error( 'Invalid documentId' ); }

			const { response, body } = await backend.documents.delete( req, documentId );

			if( response.isSuccess || response.statusCode === 400 ){

				successCb( req, documentId );

				if( req.xhr ){

					res.json( {} );

				} else {

					res.redirect( getRedirectUrl( req ) );
				}

			} else {

				throw new HttpResponseError( `Unable to delete document ${ documentId }`, response, body );
			}

		} catch ( e ){

			if( req.xhr ){

				res.status( 500 );
				res.json( { message: DELETE_ERROR_MESSAGE } );
				reporter.captureException( e );

			} else {

				next( e );
			}
		}
	}
};
