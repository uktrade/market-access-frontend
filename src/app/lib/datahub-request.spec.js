const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = './datahub-request';

const datahubUrl = 'http://some.domain.com';
const GET = 'GET';
const POST = 'POST';

describe( 'datahub Request', () => {

	let request;
	let token;
	let datahub;
	let mockResponse;
	let mockBody;

	function checkRequest( path, method, body ){

		const uri = ( datahubUrl + path );

		const requestOptions = {
			uri,
			method,
			json: true,
			headers: {
				Authorization: `Bearer ${ token }`
			}
		};

		if( body ){

			requestOptions.body = body;
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

		datahub = proxyquire( modulePath, {
			request,
			'../config': {
				datahub: { url: datahubUrl }
			}
		} );
	} );

	describe( 'Missing parameters', () => {
		describe( 'Without a path', () => {
			it( 'Should throw an error', () => {

				expect( () => {

					datahub.get();

				} ).toThrow( new Error( 'Path is required' ) );
			} );
		} );

		describe( 'Without a token', () => {
			it( 'Should throw an error', () => {

				expect( () => {

					datahub.get( '/' );

				} ).toThrow( new Error( 'Token is required' ) );
			} );
		} );
	} );

	describe( 'Without an error', () => {
		describe( 'get', () => {
			describe( 'With a 200 statusCode', () => {
				it( 'Should resolve', ( done ) => {

					const path = '/whoami/';

					datahub.get( path, token ).then( ( { response, body } ) => {

						expect( response ).toEqual( mockResponse );
						expect( body ).toEqual( mockBody );
						done();
					});

					request.calls.argsFor( 0 )[ 1 ]( null, mockResponse, mockBody );
					checkRequest( path, GET );
				} );
			} );

			describe( 'With a 404 statusCode', () => {
				it( 'Should resolve', ( done ) => {

					const path = '/whoami/';

					mockResponse.statusCode = 404;

					datahub.get( path, token ).then( ( { response, body } ) => {

						expect( response ).toEqual( mockResponse );
						expect( body ).toEqual( mockBody );
						done();
					});

					request.calls.argsFor( 0 )[ 1 ]( null, mockResponse, mockBody );
					checkRequest( path, GET );
				} );
			} );

			describe( 'With a 400 statusCode', () => {
				it( 'Should reject', ( done ) => {

					const path = '/whoami/';

					mockResponse.statusCode = 400;

					datahub.get( path, token ).then( done.fail ).catch( ( err ) => {

						expect( err ).toEqual( new Error( `Got at ${ mockResponse.statusCode } response code from datahub` ) );
						done();
					});

					request.calls.argsFor( 0 )[ 1 ]( null, mockResponse, mockBody );
					checkRequest( path, GET );
				} );
			} );
		} );

		describe( 'post', () => {
			describe( 'With a body', () => {
				it( 'Should make a POST request with a body', ( done ) => {

					const path = '/test/';
					const requestBody = { test: 'my-body' };

					datahub.post( path, token, requestBody ).then( ( { response, body } ) => {

						expect( response ).toEqual( mockResponse );
						expect( body ).toEqual( mockBody );
						done();
					} );

					request.calls.argsFor( 0 )[ 1 ]( null, mockResponse, mockBody );
					checkRequest( path, POST, requestBody );
				} );
			} );
		} );
	} );

	describe( 'With an error', () => {
		describe( 'get', () => {
			it( 'Should reject with the error', ( done ) => {

				const mockError = new Error( 'Broken' );

				datahub.get( '/test/', token ).then( done.fail ).catch( ( err ) => {

					expect( err ).toEqual( mockError );
					done();
				} );

				request.calls.argsFor( 0 )[ 1 ]( mockError, { statusCode: 400 } );
			} );
		} );
	} );
} );
