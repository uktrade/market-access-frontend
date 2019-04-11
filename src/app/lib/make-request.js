const request = require( 'request' );
const hawk = require( 'hawk' );
const config = require( '../config' );
const logger = require( './logger' );
const reporter = require( './reporter' );

function getHawkHeader( credentials, requestOptions, defaultHawkContentType ){

	const { uri, method } = requestOptions;
	const payload = requestOptions.body;

	// Generate Authorization request header
	// Ensure backend is using same protocol for hash generation
	return hawk.client.header( uri, method, {
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

module.exports = ( domain, hawkParams ) => {

	if( !domain ){ throw new Error( 'domain is required' ); }
	if( hawkParams && !hawkParams.credentials ){ throw new Error( 'Hawk requires credentials' ); }

	hawkParams = {
		enabled: true,
		defaultContentType: '',
		...hawkParams,
	};

	return function sendRequest( method, path, opts = {} ){

		if( !path ){
			throw new Error( 'Path is required' );
		}

		let clientHeader;
		const uri = ( domain + path );

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

				const message = 'Unable to stringify request body';

				logger.debug( message );
				reporter.message( 'info', message );
			}
		}

		if( opts.token ){

			requestOptions.headers.Authorization = `Bearer ${ opts.token }`;

		} else if( hawkParams.enabled ){

			clientHeader = getHawkHeader( hawkParams.credentials, requestOptions, hawkParams.defaultContentType );
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
							isValid = hawk.client.authenticate( response, hawkParams.credentials, clientHeader.artifacts, { payload: responseBody } );

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

						const error = new Error( `Got a ${ statusCode } response code for ${ uri }` );
						error.responseBody = body;

						reject( error );
					}
				}
			} );
		} );
	};
};
