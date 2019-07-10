const proxyquire = require( 'proxyquire' );
const modulePath = './user';

describe( 'user middleware', () => {

	let req;
	let res;
	let next;
	let backend;
	let middleware;
	let config;

	beforeEach( () => {

		req = { session: {} };
		res = { locals: {} };
		next = jasmine.createSpy( 'next' );

		backend = {
			getUser: jasmine.createSpy( 'backend.getUser' )
		};

		config = {
			sso :{
				bypass: false
			}
		};

		middleware = proxyquire( modulePath, {
			'../lib/backend-service': backend,
			'../config': config,
		} );
	} );

	describe( 'When the user info is not in the session', () => {
		describe( 'When the response is a success', () => {
			it( 'Should fetch the info and store it in the session', async () => {

				const userMock = { username: 'mock-user' };

				backend.getUser.and.callFake( () => Promise.resolve( { response: { isSuccess: true }, body: userMock } ) );

				await middleware( req, res, next );

				expect( backend.getUser ).toHaveBeenCalledWith( req );
				expect( req.session.user ).toEqual( userMock );
				expect( res.locals.user ).toEqual( userMock );
				expect( req.user ).toEqual( userMock );
				expect( next ).toHaveBeenCalled();
			} );
		} );

		describe( 'When the response is NOT a success', () => {
			it( 'Should call next with an error', async () => {

				const statusCode = 500;

				backend.getUser.and.callFake( () => Promise.resolve( {
					response: { isSuccess: false, statusCode },
				} ) );

				await middleware( req, res, next );

				expect( backend.getUser ).toHaveBeenCalledWith( req );
				expect( req.session.user ).not.toBeDefined();
				expect( res.locals.user ).not.toBeDefined();
				expect( req.user ).not.toBeDefined();
				expect( next ).toHaveBeenCalledWith( new Error( `Unable to get user info, got ${ statusCode } response code` ) );
			} );
		} );

		describe( 'When there is an error thrown', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'Fake error' );

				backend.getUser.and.callFake( () => Promise.reject( err ) );

				await middleware( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
			} );
		} );
	} );

	describe( 'When the user info is in the session', () => {
		it( 'Should put the user info into the req and locals', async () => {

			const sessionUser = { username: 'session-user' };

			req.session.user = sessionUser;

			await middleware( req, res, next );

			expect( backend.getUser ).not.toHaveBeenCalled();
			expect( res.locals.user ).toEqual( sessionUser );
			expect( req.user ).toEqual( sessionUser );
			expect( next ).toHaveBeenCalled();
		} );
	} );
} );
