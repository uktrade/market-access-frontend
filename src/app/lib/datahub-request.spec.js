const proxyquire = require( 'proxyquire' );
const modulePath = './datahub-request';

const GET = 'GET';
const POST = 'POST';

describe( 'Data Hub Request', () => {

	let backend;
	let makeRequest;
	let config;

	beforeEach( () => {

		config = {
			datahub: {
				url: 'https://some.domain.com',
				hawk: {
					id: 'a hawk id',
					key: 'a hawk key'
				}
			}
		};

		makeRequest = jasmine.createSpy( 'makeRequest' );
	} );

	describe( 'Calling makeRequest', () => {
		describe( 'When config.isDev is false', () => {

			let sendRequest;
			let path;
			let body;

			beforeEach( () => {

				sendRequest = jasmine.createSpy( 'sendRequest' );
				path = '/a-path';
				body = 'some body content';

				makeRequest.and.callFake( () => sendRequest );

				config.datahub.hawk.enabled = false;

				backend = proxyquire( modulePath, {
					'../config': config,
					'./make-request': makeRequest,
				} );
			} );

			it( 'Should set defaultContentType to and empty string', () => {

				expect( makeRequest ).toHaveBeenCalledWith( config.datahub.url, {
					credentials: {
						id: config.datahub.hawk.id,
						key: config.datahub.hawk.key,
						algorithm: 'sha256',
					},
					defaultContentType: ''
				} );
			} );

			describe( 'methods', () => {
				describe( 'get', () => {
					it( 'Should call sendRequest with the correct params', () => {

						backend.get( path );

						expect( sendRequest ).toHaveBeenCalledWith( GET, path );
					} );
				} );

				describe( 'post', () => {
					it( 'Should call sendRequest with the correct params', () => {

						backend.post( path, body );

						expect( sendRequest ).toHaveBeenCalledWith( POST, path, { body } );
					} );
				} );
			} );
		} );
	} );
} );
