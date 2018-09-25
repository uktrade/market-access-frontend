const request = require( 'request' );
const hawk = require( 'hawk' );
const config = require( '../config' );
const logger = require( './logger' );
const reporter = require( './reporter' );

const hawkEnabled = config.backend.hawk.enabled;
const defaultHawkContentType = ( config.isDev ? 'text/plain' : '' );

const credentials = {
	id: config.backend.hawk.id,
	key: config.backend.hawk.key,
	algorithm: 'sha256'
};

function getHawkHeader( requestOptions ){

	const { uri, method } = requestOptions;
	const payload = requestOptions.body;

	// Generate Authorization request header
	// Always use http as the backend will be running in http mode behind an https proxy
	return hawk.client.header( uri.replace( 'https', 'http' ), method, {
		credentials,
		payload: ( payload || '' ),
		contentType: ( payload ? 'application/json' : defaultHawkContentType )
	} );
}

function parseBody( uri, isJson, body ){

	if( isJson ){

		try {

			body = JSON.parse( body );

		} catch( e ){

			reporter.captureException( e, { uri } );
			logger.error( `Invalid JSON response for ${ uri }` );
		}
	}

	if( config.isDebug ){

		logger.debug( 'Response body: ' + ( isJson ? JSON.stringify( body, null, 2 ) : body ) );
	}

	return body;
}

function makeRequest( method, path, opts = {} ){

	if( !path ){
		throw new Error( 'Path is required' );
	}

	let clientHeader;
	const uri = ( config.backend.url + path );

	const requestOptions = {
		uri,
		method,
		headers: {
			accept: 'application/json'
		}
	};

	if( opts.body ){

		try {

			requestOptions.body = JSON.stringify( opts.body );
			requestOptions.headers[ 'content-type' ] = 'application/json';

		} catch( e ){

			logger.debug( 'Unable to stringify request body' );
		}
	}

	if( opts.token ){

		requestOptions.headers.Authorization = `Bearer ${ opts.token }`;

	} else if( hawkEnabled ){

		clientHeader = getHawkHeader( requestOptions );
		requestOptions.headers.Authorization = clientHeader.header;
	}

	return new Promise( ( resolve, reject ) => {

		logger.verbose( `Sending ${ method } request to: ${ uri }` );

		if( config.isDev ){

			logger.debug( 'With headers: ' + JSON.stringify( requestOptions.headers, null, 2 ) );

			if( requestOptions.body ){

				logger.debug( 'With body: ' + requestOptions.body );
			}
		}

		request( requestOptions, ( err, response, responseBody ) => {

			if( err ){

				reject( err );

			} else {

				const statusCode = response.statusCode;
				const isJson = ( response.headers[ 'content-type' ] === 'application/json' );

				logger.verbose( `Response code: ${ response.statusCode } for ${ uri }` );

				if( config.isDebug ){

					logger.debug( 'Response headers: ' + JSON.stringify( response.headers, null, 2 ) );
				}

				if( clientHeader ){

					let isValid = false;

					try {

						// Authenticate the server's response
						// must use raw response body here
						isValid = hawk.client.authenticate( response, credentials, clientHeader.artifacts, { payload: responseBody } );

					} catch ( e ){

						const err = new Error( 'Unable to validate response' );
						err.rootError = e;

						logger.error( err );
						parseBody( uri, isJson, responseBody );

						return reject( err );
					}

					logger.verbose( `Response isValid:` + !!isValid );

					if( !isValid ){

						return reject( new Error( 'Invalid response' ) );
					}
				}

				const body = parseBody( uri, isJson, responseBody );

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
