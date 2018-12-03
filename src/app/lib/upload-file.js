const fs = require( 'fs' );
const request = require( 'request' );
const config = require( '../config' );

const S3_HEADER = config.files.s3.encryption.header;
const S3_VALUE = config.files.s3.encryption.value;

module.exports = ( url, file ) => new Promise( ( resolve, reject ) => {

	const doc = fs.readFileSync( file.path );

	request( {

		url,
		method: 'PUT',
		body: doc,
		headers: {
			[ S3_HEADER ]: S3_VALUE
		}

	}, ( err, response, body ) => {

		if( err ){

			reject( err );

		} else {

			resolve( { response, body } );
		}
	} );
} );
