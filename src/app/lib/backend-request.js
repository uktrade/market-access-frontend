const request = require( 'request' );
const hawk = require( 'hawk' );
const config = require( '../config' );
const logger = require( './logger' );

const credentials = {
	'id': 'metadata',
	'key': 'kbr6j2m10n6569d29gcyufnzlnz7rez73o4zmqiv9v6e32bmu3',
	'algorithm': 'sha256'
};

function getHawkHeader( requestOptions ){

	const { uri, method } = requestOptions;
	const payload = requestOptions.body;

	// Generate Authorization request header
	return hawk.client.header( uri, method, {
		credentials,
		payload: ( payload || '' ),
		contentType: ( payload ? 'application/json' : 'text/plain' )
	} );
}

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

	if( opts.body ){

		requestOptions.body = opts.body;
	}

	if( opts.token ){

		requestOptions.headers = { Authorization: `Bearer ${ opts.token }` };

	} else {

		requestOptions.headers = { Authorization: getHawkHeader( requestOptions ).header };
	}

	return new Promise( ( resolve, reject ) => {

		logger.debug( `Sending ${ method } request to: ${ uri }` );
		logger.debug( JSON.stringify( requestOptions.headers, null, 2 ) );

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
