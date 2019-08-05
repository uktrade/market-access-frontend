const proxyquire = require( 'proxyquire' );
const modulePath = './sso-api-service';

describe( 'SSO API Service', () => {

	let service;
	let ssoApi;

	beforeEach( () => {

		ssoApi = {
			get: jasmine.createSpy( 'ssoApi.get' ),
		};

		service = proxyquire( modulePath, {
			'./sso-api-request': ssoApi
		} );
	} );

	describe( 'users', () => {
		describe( 'search', () => {
			it( 'Should call the correct path', () => {

				const query = 'tome text';

				service.users.search( query );

				expect( ssoApi.get ).toHaveBeenCalledWith( `/api/v1/user/search/?autocomplete=${ encodeURIComponent( query ) }` );
			} );
		} );
	} );
} );
