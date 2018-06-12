const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = '../../../../app/lib/backend-request';

const backendUrl = 'http://some.domain.com';
const GET = 'GET';
const POST = 'POST'

describe( 'Backend Request', () => {

	let request;
	let backend;
	let token;
	let mockResponse;
	let mockBody;

	function checkRequest( method, path, opts = {} ){

		const uri = ( backendUrl + path );

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

		expect( request.calls.argsFor( 0 )[ 0 ] ).toEqual( requestOptions );
	}

	beforeEach( () => {

		request = jasmine.createSpy( 'request' );
		token = uuid();
		mockResponse = {
			statusCode: 200
		};
		mockBody = 'a body';

		backend = proxyquire( modulePath, {
			request,
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
					it( 'Should return the response', ( done ) => {

						const path = '/whoami/';

						backend.get( path, token ).then( ( { response, body } ) => {

							expect( response.isSuccess ).toEqual( true );
							expect( response ).toEqual( mockResponse );
							expect( body ).toEqual( mockBody );
							done();
						});

						request.calls.argsFor( 0 )[ 1 ]( null, mockResponse, mockBody );
						checkRequest( GET, path, { token } );
					} );
				} );

				describe( 'With a 500 response', () => {
					it( 'Should throw an error', ( done ) => {

						const path = '/whoami/';

						mockResponse.statusCode = 500;

						backend.get( path, token ).then( done.fail ).catch( ( e ) => {

							expect( e ).toEqual( new Error( `Got at ${ mockResponse.statusCode } response code from backend` ) );
							done();
						});

						request.calls.argsFor( 0 )[ 1 ]( null, mockResponse, mockBody );
						checkRequest( GET, path, { token } );
					} );
				} );
			} );
		} );

		describe( 'With an error', () => {
			describe( 'get', () => {
				it( 'Should reject with the error', ( done ) => {

					const mockError = new Error( 'Broken' );

					backend.get( '/test/', token ).then( done.fail ).catch( ( err ) => {

						expect( err ).toEqual( mockError );
						done();
					} );

					request.calls.argsFor( 0 )[ 1 ]( mockError );
				} );
			} );
		} );
	} );

	describe( 'post', () => {
		describe( 'With a 200 response', () => {
			describe( 'Without a token or body', () => {
				it( 'Should create the correct options', ( done ) => {

					const path = '/a-test';

					backend.post( path ).then( ( { response, body } ) => {

						expect( response.isSuccess ).toEqual( true );
						expect( response ).toEqual( mockResponse );
						expect( body ).toEqual( mockBody );
						done();
					} );

					request.calls.argsFor( 0 )[ 1 ]( null, mockResponse, mockBody );
					checkRequest( POST, path );
				} );
			} );

			describe( 'Wtih a token but no body', () => {
				it( 'Should create the correct options', ( done ) => {

					const path = '/a-test';

					backend.post( path, token ).then( ( { response, body } ) => {

						expect( response.isSuccess ).toEqual( true );
						expect( response ).toEqual( mockResponse );
						expect( body ).toEqual( mockBody );
						done();
					} );

					request.calls.argsFor( 0 )[ 1 ]( null, mockResponse, mockBody );
					checkRequest( POST, path, { token } );
				} );
			} );

			describe( 'Wtih a token and body', () => {
				it( 'Should create the correct options', ( done ) => {

					const path = '/a-test';
					const body = { some: 'body' };

					backend.post( path, token, body ).then( ( { response, body } )=> {

						expect( response.isSuccess ).toEqual( true );
						expect( response ).toEqual( mockResponse );
						expect( body ).toEqual( mockBody );
						done();
					} );

					request.calls.argsFor( 0 )[ 1 ]( null, mockResponse, mockBody );
					checkRequest( POST, path, { token, body } );
				} );
			} );
		} );
	} );
} );
