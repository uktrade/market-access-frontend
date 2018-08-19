const request = require( 'request' );
const hawk = require( 'hawk' );
const config = require( '../config' );
const logger = require( './logger' );

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

		logger.debug( `Sending ${ method } request to: ${ uri }` );

		//if( config.isDev ){

			logger.debug( 'With headers: ' + JSON.stringify( requestOptions.headers, null, 2 ) );

			if( opts.body ){

				logger.debug( 'With body: ' + JSON.stringify( opts.body, null, 2 ) );
			}
		//}

		request( requestOptions, ( err, response, body ) => {

			if( err ){

				reject( err );

			} else {

				const statusCode = response.statusCode;

				//if( config.isDev ){
					logger.debug( 'Response headers: ' + JSON.stringify( response.headers, null, 2 ) );
				//}

				if( clientHeader ){

					// Authenticate the server's response
					// must use raw response body here
					const isValid = hawk.client.authenticate( response, credentials, clientHeader.artifacts, { payload: body } );

					logger.debug( `Response code: ${ response.statusCode } for ${ uri }, isValid:` + !!isValid );

					if( !isValid ){

						return reject( new Error( 'Invalid response' ) );
					}
				}

				response.isSuccess = ( statusCode >= 200 && statusCode <= 300 );

				if( response.headers[ 'content-type' ] === 'application/json' ){

					try {

						body = JSON.parse( body );

					} catch( e ){

						logger.debug( `Invalid JSON response for ${ uri }` );
					}
				}

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
