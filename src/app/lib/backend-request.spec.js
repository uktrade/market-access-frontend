const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = './backend-request';

const GET = 'GET';
const POST = 'POST';
const PUT = 'PUT';
const DELETE = 'DELETE';

describe( 'Backend Request', () => {

	let backend;
	let makeRequest;
	let config;

	beforeEach( () => {

		config = {
			isDev: false,
			backend: {
				url: 'https://some.domain.com',
				hawk: {
					enabled: true,
					id: 'a hawk id',
					key: 'a hawk key'
				}
			}
		};

		makeRequest = jasmine.createSpy( 'makeRequest' );
	} );

	describe( 'Calling makeRequest', () => {
		describe( 'When config.isDev is true', () => {
			it( 'Should set defaultContentType to text/plain', () => {

				config.isDev = true;

				backend = proxyquire( modulePath, {
					'../config': config,
					'./make-request': makeRequest,
				} );

				expect( makeRequest ).toHaveBeenCalledWith( config.backend.url, {
					enabled: true,
					credentials: {
						id: config.backend.hawk.id,
						key: config.backend.hawk.key,
						algorithm: 'sha256',
					},
					defaultContentType: 'text/plain'
				} );
			} );
		} );

		describe( 'When config.isDev is false', () => {

			let sendRequest;
			let token;
			let path;
			let body;

			beforeEach( () => {

				token = uuid();
				sendRequest = jasmine.createSpy( 'sendRequest' );
				path = '/a-path';
				body = 'some body content';

				makeRequest.and.callFake( () => sendRequest );

				config.isDev = false;
				config.backend.hawk.enabled = false;

				backend = proxyquire( modulePath, {
					'../config': config,
					'./make-request': makeRequest,
				} );
			} );

			it( 'Should set defaultContentType to and empty string', () => {

				expect( makeRequest ).toHaveBeenCalledWith( config.backend.url, {
					enabled: false,
					credentials: {
						id: config.backend.hawk.id,
						key: config.backend.hawk.key,
						algorithm: 'sha256',
					},
					defaultContentType: ''
				} );
			} );

			describe( 'methods', () => {
				describe( 'get', () => {
					it( 'Should call sendRequest with the correct params', () => {

						backend.get( path, token );

						expect( sendRequest ).toHaveBeenCalledWith( GET, path, { token } );
					} );
				} );

				describe( 'post', () => {
					it( 'Should call sendRequest with the correct params', () => {

						backend.post( path, token, body );

						expect( sendRequest ).toHaveBeenCalledWith( POST, path, { token, body } );
					} );
				} );

				describe( 'put', () => {
					it( 'Should call sendRequest with the correct params', () => {

						backend.put( path, token, body );

						expect( sendRequest ).toHaveBeenCalledWith( PUT, path, { token, body } );
					} );
				} );

				describe( 'delete', () => {
					it( 'Should call sendRequest with the correct params', () => {

						backend.delete( path, token, body );

						expect( sendRequest ).toHaveBeenCalledWith( DELETE, path, { token, body } );
					} );
				} );
			} );
		} );
	} );
} );
