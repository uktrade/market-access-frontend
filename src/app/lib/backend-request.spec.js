const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = './backend-request';

const backendUrl = 'http://some.domain.com';
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

		backend = proxyquire( modulePath, {
			request,
			hawk,
			'../config': {
				backend: { url: backendUrl }
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
					it( 'Should return the response', async () => {

						respondWithMocks();

						const path = '/whoami/';

						const responseData = await backend.get( path, token );

						checkRequest( GET, path, { token } );
						checkForMockResponse( responseData );
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
			describe( 'Without a token or body', () => {
				it( 'Should create the correct options', async () => {

					respondWithMocks();

					const path = '/a-test';

					const responseData = await backend.post( path );

					checkRequest( POST, path );
					checkForMockResponse( responseData );
				} );
			} );

			describe( 'With a token but no body', () => {
				it( 'Should create the correct options', async () => {

					respondWithMocks();

					const path = '/a-test';

					const responseData = await backend.post( path, token );

					checkRequest( POST, path, { token } );
					checkForMockResponse( responseData );
				} );
			} );

			describe( 'With a token and body', () => {
				it( 'Should create the correct options', async () => {

					respondWithMocks();

					const path = '/a-test';
					const body = { some: 'body' };

					const responseData = await backend.post( path, token, body );

					checkRequest( POST, path, { token, body } );
					checkForMockResponse( responseData );
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
