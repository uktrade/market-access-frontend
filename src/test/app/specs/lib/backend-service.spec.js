const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = '../../../../app/lib/backend-service';

describe( 'Backend Service', () => {

	let token;
	let backend;
	let service;

	beforeEach( () => {
	
		token = uuid();
		backend = {
			get: jasmine.createSpy( 'backend.get' )
		};

		service = proxyquire( modulePath, {
			'./backend-request': backend
		} );
	} );

	describe( 'getUser', () => {
	
		it( 'Should call the correct path', () => {
	
			service.getUser( token );

			expect( backend.get ).toHaveBeenCalledWith( '/whoami/', token );
		} );
	} );
} );
