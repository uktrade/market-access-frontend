const request = require( 'request' );
const config = require( '../config' );
const logger = require( './logger' );

const GET = 'GET';

function makeRequest( path, method, token ){

	if( !path ){
		throw new Error( 'Path is required' );
	}

	if( !token ){
		throw new Error( 'Token is required' );
	}

	const uri = ( config.backend.url + path );

	const requestOptions = {
		uri,
		method,
		json: true,
		headers: {
			Authorization: `Bearer ${ token }`
		}
	};

	return new Promise( ( resolve, reject ) => {

		logger.debug( `Sending ${ method } request to: ${ uri }` );
	
		request( requestOptions, ( err, response, body ) => {

			if( err ){

				reject( err );

			} else {

				resolve( { response, body } );
			}
		} );
	} );
}

module.exports = {

	get: ( path, token ) => makeRequest( path, GET, token )
};
