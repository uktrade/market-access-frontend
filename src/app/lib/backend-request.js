const request = require( 'request' );
const config = require( '../config' );
const logger = require( './logger' );

function makeRequest( method, path, opts = {} ){

	if( !path ){
		throw new Error( 'Path is required' );
	}

	const uri = ( config.backend.url + path );

	const requestOptions = {
		uri,
		method,
		json: true
	};

	if( opts.token ){

		requestOptions.headers = { Authorization: `Bearer ${ opts.token }` };
	}

	if( opts.body ){

		requestOptions.body = opts.body;
	}

	return new Promise( ( resolve, reject ) => {

		logger.debug( `Sending ${ method } request to: ${ uri }` );

		if( opts.body ){
			logger.debug( 'With body: ' + JSON.stringify( opts.body, null, 2 ) );
		}

		request( requestOptions, ( err, response, body ) => {

			if( err ){

				reject( err );

			} else {

				const statusCode = response.statusCode;

				response.isSuccess = ( statusCode >= 200 && statusCode <= 300 );

				if( response.isSuccess || statusCode === 404 || statusCode === 400 ){

					resolve( { response, body } );

				} else {

					const error = new Error( `Got at ${ statusCode } response code from backend` );
					error.responseBody = body;

					reject( error );
				}
			}
		} );
	} );
}

module.exports = {

	get: ( path, token ) => makeRequest( 'GET', path, { token } ),
	post: ( path, token, body ) => makeRequest( 'POST', path, { token, body } ),
	put: ( path, token, body ) => makeRequest( 'PUT', path, { token, body } )
};
