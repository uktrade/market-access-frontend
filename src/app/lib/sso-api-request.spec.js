const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = './sso-api-request';

const GET = 'GET';

describe( 'SSO API Request', () => {

	let ssoApi;
	let makeRequest;
	let config;
	let token;

	beforeEach( () => {

		token = uuid();

		config = {
			sso: {
				protocol: 'a',
				domain: 'b.com',
				port: 500,
				api: {
					token,
				}
			}
		};

		makeRequest = jasmine.createSpy( 'makeRequest' );
	} );

	describe( 'Calling makeRequest', () => {

		let sendRequest;
		let path;

		beforeEach( () => {

			sendRequest = jasmine.createSpy( 'sendRequest' );
			path = '/a-path';

			makeRequest.and.callFake( () => sendRequest );

			ssoApi = proxyquire( modulePath, {
				'../config': config,
				'./make-request': makeRequest,
			} );
		} );

		it( 'Should call it with the correct url string', () => {

			expect( makeRequest ).toHaveBeenCalledWith( `${ config.sso.protocol }://${ config.sso.domain }:${ config.sso.port }` );
		} );

		describe( 'methods', () => {
			describe( 'get', () => {
				it( 'Should call sendRequest with the correct params', () => {

					ssoApi.get( path );

					expect( sendRequest ).toHaveBeenCalledWith( GET, path, { token } );
				} );
			} );
		} );
	} );
} );
