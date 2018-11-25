const fs = require( 'fs' );
const request = require( 'request' );

module.exports = ( url, file ) => new Promise( ( resolve, reject ) => {

	/*
	const req = request.post( url );

	req.on( 'response', resolve );
	req.on( 'error', reject );

	fs.createReadStream( file.path ).pipe( req );
	*/

	const doc = fs.readFileSync( file.path );

	request( {

		url,
		method: 'PUT',
		body: doc,

	}, ( err, response, body ) => {

		if( err ){

			reject( err );

		} else {

			resolve( { response, body } );
		}
	} );
} );
