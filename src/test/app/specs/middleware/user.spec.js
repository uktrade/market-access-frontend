const proxyquire = require( 'proxyquire' );
const modulePath = '../../../../app/middleware/user';

fdescribe( 'user middleware', () => {

	let req;
	let res;
	let next;
	let backend;
	let middleware;

	beforeEach( () => {

		req = { session: {} };
		res = { locals: {} };
		next = jasmine.createSpy( 'next' );

		backend = {
			getUser: jasmine.createSpy( 'backend.getUser' )
		};
	
		middleware = proxyquire( modulePath, {
			'../lib/backend-service': backend
		} );
	} );

	describe( 'When the user info is not in the session', () => {

		it( 'Should fetch the info and store in the session', ( done ) => {

			const userMock = { username: 'mock-user' };
			const promise = new Promise( ( resolve ) => resolve( userMock ) );

			backend.getUser.and.callFake( () => promise );
			
			middleware( req, res, next );

			promise.then( () => {

				expect( backend.getUser ).toHaveBeenCalledWith( req );
				expect( req.session.user ).toEqual( userMock );
				expect( res.locals.user ).toEqual( userMock );
				expect( next ).toHaveBeenCalled();
				done();
			} );
		} );
	} );

	describe( 'When the user info is in the session', () => {
	
		it( 'Should put the user info into locals', () => {

			const sessionUser = { username: 'session-user' };

			req.session.user = sessionUser;

			middleware( req, res, next );
	
			expect( res.locals.user ).toEqual( sessionUser );
			expect( next ).toHaveBeenCalled();
		} );
	} );
} );
