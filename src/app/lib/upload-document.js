const uploadFile = require( './upload-file' );
const reporter = require( './reporter' );
const backend = require( './backend-service' );

module.exports = ( req, file ) => new Promise( async ( resolve, reject ) => {

	try {

		const { response, body } = await backend.documents.create( req, file.name, file.size );

		if( response.isSuccess ){

			const { id, signed_upload_url } = body;

			uploadFile( signed_upload_url, file ).then( async ( { response } ) => {

				if( response.statusCode === 200 ){

					const { response } = await backend.documents.uploadComplete( req, id );

					if( response.isSuccess ){

						resolve( id );

					} else {

						const err = new Error( 'Unable to complete upload' );

						reject( err );
						reporter.captureException( err, { response: {
							statusCode: response.statusCode,
							documentId: id,
						} } );
					}

				} else {

					const err = new Error( 'Unable to upload document to S3' );

					reject( err );
					reporter.captureException( err, {
						response: {
							statusCode: response.statusCode,
							body: response.body,
							documentId: id,
						}
					} );
				}

			} ).catch( ( e ) => {

				reject( e );
				reporter.captureException( e, { documentId: id } );
			} );

		} else {

			reject( new Error( 'Could not create document' ) );
		}

	} catch ( e ){

		reject( e );
	}
} );
