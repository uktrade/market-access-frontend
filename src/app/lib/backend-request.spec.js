const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = './backend-request';

const backendUrl = 'https://some.domain.com';
const GET = 'GET';
const POST = 'POST';
const PUT = 'PUT';

describe( 'Backend Request', () => {

	let request;
	let hawk;
	let backend;
	let token;
	let mockResponse;
	let mockBody;
	let hawkHeaderResponse;
	let hawkCredentials;
	let logger;
	let reporter;

	function checkRequest( method, path, opts = {} ){

		const uri = ( backendUrl + path );

		const requestOptions = {
			uri,
			method,
			headers: {
				accept: 'application/json'
			}
		};

		if( opts.token ){

			requestOptions.headers.Authorization = `Bearer ${ opts.token }`;

		} else {

			requestOptions.headers.Authorization = hawkHeaderResponse;
		}

		if( opts.body ){

			requestOptions.body = JSON.stringify( opts.body );
			requestOptions.headers[ 'content-type' ] = 'application/json';
		}

		expect( request.calls.argsFor( 0 )[ 0 ] ).toEqual( requestOptions );

		return requestOptions;
	}

	function checkForMockResponse( { response, body } ){

		expect( response.isSuccess ).toEqual( true );
		expect( response ).toEqual( mockResponse );
		expect( body ).toEqual( mockBody );
	}

	function requestCallback( ...args ){

		request.and.callFake( ( opts, cb ) => cb( ...args ) );
	}

	function respondWithMocks(){

		requestCallback( null, mockResponse, mockBody );
	}

	beforeEach( () => {

		logger = jasmine.helpers.mockLogger.create();
		reporter = {
			captureException: jasmine.createSpy( 'reporter.captureException' )
		},
		request = jasmine.createSpy( 'request' );
		hawkHeaderResponse = 'a hawk header';
		hawk = {
			client: {
				header: jasmine.createSpy( 'hawk.client.header' ).and.callFake( () => ({ header: hawkHeaderResponse }) ),
				authenticate: jasmine.createSpy( 'hawk.client.authenticate' ).and.callFake( () => true )
			}
		};
		hawkCredentials = {
			enabled: true,
			id: 'a hawk id',
			key: 'a hawk key'
		};
		token = uuid();
		mockResponse = {
			headers: {},
			statusCode: 200
		};
		mockBody = 'a body';

		backend = proxyquire( modulePath, {
			request,
			hawk,
			'./logger': logger,
			'./reporter': reporter,
			'../config': {
				backend: {
					url: backendUrl,
					hawk: hawkCredentials
				}
			}
		} );
	} );

	describe( 'get', () => {
		describe( 'Missing parameters', () => {
			describe( 'Without a path', () => {
				it( 'Should throw an error', () => {

					expect( () => {

						backend.get();

					} ).toThrow( new Error( 'Path is required' ) );
				} );
			} );
		} );

		describe( 'Without an error', () => {
			describe( 'get', () => {
				describe( 'With a 200 response', () => {
					describe( 'An unspecified response type', () => {
						it( 'Should return the response', async () => {

							respondWithMocks();

							const path = '/whoami/';

							const responseData = await backend.get( path, token );

							checkRequest( GET, path, { token } );
							checkForMockResponse( responseData );
						} );
					} );

					describe( 'An application/json response type', () => {

						beforeEach( () => {

							mockResponse.headers[ 'content-type' ] = 'application/json';
						} );

						describe( 'With a valid JSON body', () => {

							beforeEach( () => {

								requestCallback( null, mockResponse, '{ "a": 1, "b": 2 }' );
							} );

							describe( 'With a token', () => {
								it( 'Should return the response', async () => {

									const path = '/whoami/';

									const { response, body } = await backend.get( path, token );

									checkRequest( GET, path, { token } );
									expect( response.isSuccess ).toEqual( true );
									expect( response ).toEqual( mockResponse );
									expect( body ).toEqual( { a: 1, b: 2 } );
								} );
							} );

							describe( 'With a valid hawk response', () => {
								it( 'Should return the response', async () => {

									const path = '/whoami/';

									const { response, body } = await backend.get( path );

									checkRequest( GET, path );
									expect( response.isSuccess ).toEqual( true );
									expect( response ).toEqual( mockResponse );
									expect( body ).toEqual( { a: 1, b: 2 } );
								} );
							} );

							describe( 'With an invalid hawk response', () => {
								it( 'Should reject with an error', async () => {

									let err;
									const path = '/path';
									hawk.client.authenticate.and.callFake( () => false );

									try {

										await backend.get( path );

									} catch( e ){

										err = e;
									}

									checkRequest( GET, path );
									expect( err ).toEqual( new Error( 'Invalid response' ) );
								} );
							} );
						} );

						describe( 'With an invalid JSON body', () => {
							it( 'Should return the response', async () => {

								const invalidBody = '[ "test" : 123 ]';
								requestCallback( null, mockResponse, invalidBody );

								const path = '/whoami/';

								const { response, body } = await backend.get( path, token );

								checkRequest( GET, path, { token } );
								expect( response.isSuccess ).toEqual( true );
								expect( response ).toEqual( mockResponse );
								expect( body ).toEqual( invalidBody );
								expect( reporter.captureException ).toHaveBeenCalledWith( new SyntaxError( 'Unexpected token : in JSON at position 9' ), { uri: 'https://some.domain.com/whoami/' });
							} );
						} );
					} );
				} );

				describe( 'With a 500 response', () => {
					it( 'Should throw an error', ( done ) => {

						respondWithMocks();

						const path = '/whoami/';

						mockResponse.statusCode = 500;

						backend.get( path, token ).then( done.fail ).catch( ( e ) => {

							expect( e ).toEqual( new Error( `Got at ${ mockResponse.statusCode } response code from backend` ) );
							done();
						});

						checkRequest( GET, path, { token } );
					} );
				} );
			} );
		} );

		describe( 'With an error', () => {
			describe( 'get', () => {
				it( 'Should reject with the error', ( done ) => {

					const mockError = new Error( 'Broken' );

					requestCallback( mockError );

					backend.get( '/test/', token ).then( done.fail ).catch( ( err ) => {

						expect( err ).toEqual( mockError );
						done();
					} );
				} );
			} );
		} );
	} );

	describe( 'post', () => {
		describe( 'With a 200 response', () => {

			let path;

			beforeEach( () => {

				path = '/a-test';
				respondWithMocks();
			} );

			describe( 'Without a token or body', () => {
				it( 'Should create a hawk header with the correct options', async () => {

					const responseData = await backend.post( path );

					const requestOptions = checkRequest( POST, path );
					checkForMockResponse( responseData );
					expect( hawk.client.header ).toHaveBeenCalledWith(
						requestOptions.uri.replace( 'https', 'http' ),
						requestOptions.method,
						{
							credentials: {
								id: hawkCredentials.id,
								key: hawkCredentials.key,
								algorithm: 'sha256'
							},
							payload: '',
							contentType: 'text/plain'
						}
					);
				} );
			} );

			describe( 'Without a token but with a body', () => {
				it( 'Should create a hawk header with the correct options', async () => {

					const body = { some: 'body' };

					const responseData = await backend.post( path, null, body );

					const requestOptions = checkRequest( POST, path, { body } );
					checkForMockResponse( responseData );
					expect( hawk.client.header ).toHaveBeenCalledWith(
						requestOptions.uri.replace( 'https', 'http' ),
						requestOptions.method,
						{
							credentials: {
								id: hawkCredentials.id,
								key: hawkCredentials.key,
								algorithm: 'sha256'
							},
							payload: JSON.stringify( body ),
							contentType: 'application/json'
						}
					);
				} );
			} );

			describe( 'With a token but no body', () => {
				it( 'Should create the correct options', async () => {

					const responseData = await backend.post( path, token );

					checkRequest( POST, path, { token } );
					checkForMockResponse( responseData );
				} );
			} );

			describe( 'With a token and body', () => {
				describe( 'With a valid JSON body', () => {
					it( 'Should create the correct options', async () => {

						const body = { some: 'body' };

						const responseData = await backend.post( path, token, body );

						checkRequest( POST, path, { token, body } );
						checkForMockResponse( responseData );
					} );
				} );

				describe( 'With an invalid JSON body', () => {
					it( 'Should log an error create the correct options', async () => {

						const circularReference = { otherData: 123 };
						circularReference.myself = circularReference;

						const responseData = await backend.post( path, token, circularReference );

						checkRequest( POST, path, { token, circularReference } );
						checkForMockResponse( responseData );
						expect( logger.debug ).toHaveBeenCalledWith( 'Unable to stringify request body' );
					} );
				} );
			} );
		} );
	} );

	describe( 'put', () => {
		describe( 'With a 200 response', () => {
			describe( 'Without a token or body', () => {
				it( 'Should create the correct options', async () => {

					respondWithMocks();

					const path = '/a-test';

					const responseData = await backend.put( path );

					checkRequest( PUT, path );
					checkForMockResponse( responseData );
				} );
			} );

			describe( 'With a token but no body', () => {
				it( 'Should create the correct options', async () => {

					respondWithMocks();

					const path = '/a-test';

					const responseData = await backend.put( path, token );

					checkRequest( PUT, path, { token } );
					checkForMockResponse( responseData );
				} );
			} );

			describe( 'With a token and body', () => {
				it( 'Should create the correct options', async () => {

					respondWithMocks();

					const path = '/a-test';
					const body = { some: 'body' };

					const responseData = await backend.put( path, token, body );

					checkRequest( PUT, path, { token, body } );
					checkForMockResponse( responseData );
				} );
			} );
		} );
	} );
} );
