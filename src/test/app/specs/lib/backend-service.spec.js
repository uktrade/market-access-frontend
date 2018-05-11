const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = '../../../../app/lib/backend-service';

describe( 'Backend Service', () => {

	let token;
	let backend;
	let service;
	let req;

	beforeEach( () => {
	
		token = uuid();
		req = { session: { ssoToken: token} };
		backend = {
			get: jasmine.createSpy( 'backend.get' )
		};

		service = proxyquire( modulePath, {
			'./backend-request': backend
		} );
	} );

	describe( 'getUser', () => {
	
		it( 'Should call the correct path', () => {
	
			service.getUser( req );

			expect( backend.get ).toHaveBeenCalledWith( '/whoami/', token );
		} );
	} );
} );
