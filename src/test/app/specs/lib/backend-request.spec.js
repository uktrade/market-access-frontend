const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = '../../../../app/lib/backend-request';

const backendUrl = 'http://some.domain.com';
const GET = 'GET';

describe( 'Backend Request', () => {

	let request;
	let backend;
	let token;
	let mockResponse;
	let mockBody;

	function checkRequest( path, method, opts ){

		const uri = ( backendUrl + path );

		const requestOptions = {
			uri,
			method,
			json: true
		};

		if( opts.token ){

			requestOptions.headers = {
				Authorization: `Bearer ${ opts.token }`
			};
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

	describe( 'Missing parameters', () => {
	
		describe( 'Without a path', () => {
		
			it( 'Should throw an error', () => {
			
				expect( () => {

					backend.get();

				} ).toThrow( new Error( 'Path is required' ) );
			} );
		} );

		describe( 'Without a token', () => {
		
			it( 'Should throw an error', () => {
			
				expect( () => {

					backend.get( '/' );

				} ).toThrow( new Error( 'Token is required' ) );
			} );
		} );
	} );

	describe( 'Without an error', () => {
	
		describe( 'get', () => {
		
			it( 'Should make a GET request', ( done ) => {
		
				const path = '/whoami/';

				backend.get( path, token ).then( ( { response, body } ) => {

					expect( response ).toEqual( mockResponse );
					expect( body ).toEqual( mockBody );
					done();
				});

				request.calls.argsFor( 0 )[ 1 ]( null, mockResponse, mockBody );
				checkRequest( path, GET, { token } );
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
