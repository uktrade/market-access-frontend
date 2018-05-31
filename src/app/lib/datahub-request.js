const request = require( 'request' );
const config = require( '../config' );
const logger = require( './logger' );

const GET = 'GET';
const POST = 'POST';

function makeRequest( path, method, token, opts = {} ){

	if( !path ){
		throw new Error( 'Path is required' );
	}

	if( !token ){
		throw new Error( 'Token is required' );
	}

	const uri = ( config.datahub.url + path );

	const requestOptions = {
		uri,
		method,
		json: true,
		headers: {
			Authorization: `Bearer ${ token }`
		}
	};

	if( opts.body ){

		requestOptions.body = opts.body;
	}

	return new Promise( ( resolve, reject ) => {

		logger.debug( `Sending ${ method } request to: ${ uri }` );
	
		request( requestOptions, ( err, response, body ) => {

			if( err ){

				reject( err );

			} else {

				response.isSuccess = ( response.statusCode >= 200 && response.statusCode <= 300 );

				if( response.isSuccess || response.statusCode === 404 ){

					resolve( { response, body } );

				} else {

					reject( new Error( `Got at ${ response.statusCode } response code from datahub` ) );
				}
			}
		} );
	} );
}

module.exports = {

	get: ( path, token ) => makeRequest( path, GET, token ),
	post: ( path, token, body ) => makeRequest( path, POST, token, { body } )
};
