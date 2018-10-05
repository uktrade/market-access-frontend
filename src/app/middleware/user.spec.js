const proxyquire = require( 'proxyquire' );
const modulePath = './user';

describe( 'user middleware', () => {

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
		describe( 'When there is an error thrown', () => {
			it( 'Should call next with the error', ( done ) => {

				const err = new Error( 'Fake error' );
				const promise = new Promise( ( resolve, reject ) => {

					reject( err );
				} );

				backend.getUser.and.callFake( () => promise );

				middleware( req, res, next );

				process.nextTick( () => {

					expect( next ).toHaveBeenCalledWith( err );
					done();
				} );
			} );
		} );

		describe( 'When there is NOT an error thrown', () => {
			it( 'Should fetch the info and store it in the session', ( done ) => {

				const userMock = { username: 'mock-user' };
				const promise = new Promise( ( resolve ) => resolve( { response: {}, body: userMock } ) );

				backend.getUser.and.callFake( () => promise );

				middleware( req, res, next );

				promise.then( () => {

					expect( backend.getUser ).toHaveBeenCalledWith( req );
					expect( req.session.user ).toEqual( userMock );
					expect( res.locals.user ).toEqual( userMock );
					expect( req.user ).toEqual( userMock );
					expect( next ).toHaveBeenCalled();
					done();
				} );
			} );
		} );

	} );

	describe( 'When the user info is in the session', () => {
		it( 'Should put the user info into the req and locals', () => {

			const sessionUser = { username: 'session-user' };

			req.session.user = sessionUser;

			middleware( req, res, next );

			expect( res.locals.user ).toEqual( sessionUser );
			expect( req.user ).toEqual( sessionUser );
			expect( next ).toHaveBeenCalled();
		} );
	} );
} );
