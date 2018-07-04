const auth = require( './auth' );

describe( 'auth middleware', () => {

	let req = {};
	let res = {};
	let next;

	beforeEach( () => {

		res.redirect = jasmine.createSpy( 'res.redirect' );
		req.session = {};
	} );

	describe( 'For the index page', () => {
		beforeEach( () => {

			req.url = '/';
			next = jasmine.createSpy( 'next' );
		} );

		describe( 'When there is an ssoToken in the session', () => {
			it( 'Should call next', () => {

				req.session.ssoToken = 'mytoken';

				auth( req, res, next );
				expect( next ).toHaveBeenCalled();
			} );
		} );

		describe( 'When there is NOT an ssoToken in the session', () => {
			it( 'Should redirect to the login page', () => {

				auth( req, res, next );

				expect( req.session.returnPath ).toEqual( req.url );
				expect( res.redirect ).toHaveBeenCalledWith( '/login/' );
			} );
		} );
	} );

	describe( 'Login paths', () => {
		describe( 'root', () => {
			it( 'Should call next', () => {

				req.url = '/login/';
				auth( req, res, next );

				expect( next ).toHaveBeenCalled();
			} );
		} );

		describe( 'callback', () => {
			it( 'Should call next', () => {

				req.url = '/login/callback/';
				auth( req, res, next );

				expect( next ).toHaveBeenCalled();
			} );
		} );
	} );
} );
