const request = require( 'request' );
const config = require( '../config' );
const logger = require( './logger' );

const datahubToken = config.datahub.token;

function makeRequest( method, path, token, opts = {} ){

	if( !path ){
		throw new Error( 'Path is required' );
	}

	if( !token ){
		throw new Error( 'Token is required' );
	}

	const uri = ( config.datahub.url + path );

	// Temporary workaround to specify a known token
	if( datahubToken ){

		token = datahubToken;
	}

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

				const statusCode = response.statusCode;

				response.isSuccess = ( statusCode >= 200 && statusCode <= 300 );

				if( response.isSuccess || statusCode === 404 || statusCode === 403 ){

					resolve( { response, body } );

				} else {

					reject( new Error( `Got at ${ statusCode } response code from datahub` ) );
				}
			}
		} );
	} );
}

module.exports = {

	get: ( path, token ) => makeRequest( 'GET', path, token ),
	post: ( path, token, body ) => makeRequest( 'POST', path, token, { body } )
};
