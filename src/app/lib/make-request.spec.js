const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = './make-request';

const GET = 'GET';
const POST = 'POST';

describe( 'makeRequest', () => {

	let domain;
	let request;
	let hawk;
	let makeRequest;
	let sendRequest;
	let token;
	let mockResponse;
	let mockBody;
	let hawkHeaderResponse;
	let logger;
	let reporter;

	function checkRequest( method, path, opts = {} ){

		const uri = ( domain + path );

		const requestOptions = {
			uri,
			method,
			headers: {
				accept: 'application/json'
			}
		};

		if( opts.token ){

			requestOptions.headers.Authorization = `Bearer ${ opts.token }`;

		} else if( !opts.skipCheckForHawk ){

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
		reporter = jasmine.helpers.mocks.reporter();
		request = jasmine.createSpy( 'request' );
		hawkHeaderResponse = 'a hawk header';
		hawk = {
			client: {
				header: jasmine.createSpy( 'hawk.client.header' ).and.callFake( () => ({ header: hawkHeaderResponse }) ),
				authenticate: jasmine.createSpy( 'hawk.client.authenticate' ).and.callFake( () => true )
			}
		};

		token = uuid();
		mockResponse = {
			headers: {},
			statusCode: 200
		};
		mockBody = 'a body';

		makeRequest = proxyquire( modulePath, {
			request,
			hawk,
			'./logger': logger,
			'./reporter': reporter,
			'../config': {
				isDev: false,
				isDebug: true
			}
		} );

	} );

	describe( 'Without a domain', () => {
		it( 'Should throw an error', () => {

			expect( () => makeRequest() ).toThrow( new Error( 'domain is required' ) );
		} );
	} );

	describe( 'With a domain', () => {

		beforeEach( () => {

			domain = 'https://some.domain.com';
		} );

		describe( 'Without any hawkParams', () => {
			it( 'Should not throw an error', () => {

				expect( () => makeRequest( domain ) ).not.toThrow();
			} );

			describe( 'A GET request', () => {

				beforeEach( () => {

					sendRequest = makeRequest( domain );
				} );

				describe( 'Without a path', () => {
					it( 'Should throw an error', () => {

						expect( () => sendRequest( GET ) ).toThrow( new Error( 'Path is required' ) );
					} );
				} );

				describe( 'With a path', () => {

					let path;

					beforeEach( () => {

						path = '/test-path';
					} );

					describe( 'With a token', () => {

						afterEach( () => {

							checkRequest( GET, path, { token } );
						} );

						describe( 'With a 200 response', () => {
							describe( 'An unspecified response type', () => {
								it( 'Should return the response', async () => {

									respondWithMocks();

									const responseData = await sendRequest( GET, path, { token } );

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

									it( 'Should return the response', async () => {

										const { response, body } = await sendRequest( GET, path, { token } );

										expect( response.isSuccess ).toEqual( true );
										expect( response ).toEqual( mockResponse );
										expect( body ).toEqual( { a: 1, b: 2 } );
									} );
								} );

								describe( 'With an invalid JSON body', () => {
									it( 'Should return the response', async () => {

										const invalidBody = '[ "test" : 123 ]';
										requestCallback( null, mockResponse, invalidBody );

										const { response, body } = await sendRequest( GET, path, { token } );

										expect( response.isSuccess ).toEqual( true );
										expect( response ).toEqual( mockResponse );
										expect( body ).toEqual( invalidBody );
										expect( reporter.captureException ).toHaveBeenCalledWith( new SyntaxError( 'Unexpected token : in JSON at position 9' ), { uri: ( domain + path ) });
									} );
								} );
							} );
						} );

						describe( 'With a 500 response', () => {
							it( 'Should throw an error', ( done ) => {

								respondWithMocks();

								mockResponse.statusCode = 500;

								sendRequest( GET, path, { token } ).then( done.fail ).catch( ( e ) => {

									expect( e ).toEqual( new Error( `Got a ${ mockResponse.statusCode } response code for ${ domain + path }` ) );
									done();
								});
							} );
						} );

						describe( 'With an error', () => {
							it( 'Should reject with the error', ( done ) => {

								const mockError = new Error( 'Broken' );

								requestCallback( mockError );

								sendRequest( GET, path, { token } ).then( done.fail ).catch( ( err ) => {

									expect( err ).toEqual( mockError );
									done();
								} );
							} );
						} );
					} );
				} );
			} );
		} );

		describe( 'With empty hawkParams', () => {
			it( 'Should throw an error', () => {

				expect( () => makeRequest( domain, {} ) ).toThrow( new Error( 'Hawk requires credentials' ) );
			} );
		} );

		describe( 'With hawk credentials', () => {

			let hawkParams;

			beforeEach( () => {

				hawkParams = {
					credentials: {
						id: 'a hawk id',
						key: 'a hawk key',
						algorithm: 'sha256',
					}
				};
			} );

			it( 'Should not throw an error', () => {

				expect( () => makeRequest( domain, hawkParams ) );
			} );

			describe( 'When setting hawkParams.enabled to false', () => {
				it( 'Should not create a token or hawk header', async () => {

					const path = '/a-path-here';

					hawkParams.enabled = false;

					sendRequest = makeRequest( domain, hawkParams );

					respondWithMocks();

					const responseData = await sendRequest( POST, path );

					checkRequest( POST, path, { skipCheckForHawk: true } );
					checkForMockResponse( responseData );
					expect( hawk.client.header ).not.toHaveBeenCalled();
				} );
			} );

			describe( 'A POST request', () => {

				beforeEach( () => {

					sendRequest = makeRequest( domain, hawkParams );
				} );

				describe( 'With a path', () => {

					let path;

					beforeEach( () => {

						path = '/test-post';
					} );

					describe( 'With a 200 response', () => {

						beforeEach( () => {

							respondWithMocks();
						} );

						describe( 'Without a token or body', () => {
							describe( 'Without specifying a default content type', () => {
								it( 'Should create a hawk header with the correct options', async () => {

									const responseData = await sendRequest( POST, path );

									const requestOptions = checkRequest( POST, path );
									checkForMockResponse( responseData );
									expect( hawk.client.header ).toHaveBeenCalledWith(
										requestOptions.uri,
										requestOptions.method,
										{
											credentials: {
												id: hawkParams.credentials.id,
												key: hawkParams.credentials.key,
												algorithm: 'sha256'
											},
											payload: '',
											contentType: ''
										}
									);
								} );
							} );

							describe( 'When specifying a default content type', () => {
								it( 'Should create a hawk header with the correct options', async () => {

									sendRequest = makeRequest( domain, { ...hawkParams, defaultContentType: 'text/plain' } );

									const responseData = await sendRequest( POST, path );

									const requestOptions = checkRequest( POST, path );
									checkForMockResponse( responseData );
									expect( hawk.client.header ).toHaveBeenCalledWith(
										requestOptions.uri,
										requestOptions.method,
										{
											credentials: {
												id: hawkParams.credentials.id,
												key: hawkParams.credentials.key,
												algorithm: 'sha256'
											},
											payload: '',
											contentType: 'text/plain'
										}
									);
								} );
							} );
						} );

						describe( 'Without a token but with a body', () => {
							describe( 'With a valid JSON body', () => {
								it( 'Should create a hawk header with the correct options', async () => {

									const body = { some: 'body' };

									const responseData = await sendRequest( POST, path, { body } );

									const requestOptions = checkRequest( POST, path, { body } );
									checkForMockResponse( responseData );
									expect( hawk.client.header ).toHaveBeenCalledWith(
										requestOptions.uri,
										requestOptions.method,
										{
											credentials: {
												id: hawkParams.credentials.id,
												key: hawkParams.credentials.key,
												algorithm: 'sha256'
											},
											payload: JSON.stringify( body ),
											contentType: 'application/json'
										}
									);
								} );
							} );

							describe( 'With an invalid JSON body', () => {
								it( 'Should log an error', async () => {

									const circularReference = { otherData: 123 };
									const message = 'Unable to stringify request body';
									circularReference.myself = circularReference;

									const responseData = await sendRequest( POST, path, { body: circularReference } );

									checkRequest( POST, path, { circularReference } );
									checkForMockResponse( responseData );
									expect( logger.debug ).toHaveBeenCalledWith( message );
									expect( reporter.message ).toHaveBeenCalledWith( 'info', message );
								} );
							} );

							describe( 'With a valid hawk response', () => {
								it( 'Should return the response', async () => {

									const { response, body } = await sendRequest( POST, path );

									checkRequest( POST, path );
									expect( response.isSuccess ).toEqual( true );
									expect( response ).toEqual( mockResponse );
									expect( body ).toEqual( 'a body' );
								} );
							} );

							describe( 'With an invalid hawk response', () => {
								it( 'Should reject with an error', async () => {

									let err;
									hawk.client.authenticate.and.callFake( () => false );

									try {

										await sendRequest( POST, path );

									} catch( e ){

										err = e;
									}

									checkRequest( POST, path );
									expect( err ).toEqual( new Error( 'Invalid response' ) );
								} );
							} );

							describe( 'With an error checking the hawk response', () => {
								it( 'Should reject with an error', async () => {

									let err;
									hawk.client.authenticate.and.callFake( () => { throw new Error( 'fail' ); } );

									try {

										await sendRequest( POST, path );

									} catch( e ){

										err = e;
									}

									checkRequest( POST, path );
									expect( err ).toEqual( new Error( 'Unable to validate response' ) );
								} );
							} );
						} );
					} );
				} );
			} );
		} );
	} );
} );
