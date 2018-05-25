const proxyquire = require( 'proxyquire' );
const modulePath = '../../../../app/middleware/sso-bypass';

describe( 'SSO bypass', () => {

	let req;
	let res;
	let next;

	beforeEach( () => {

		req = { session: {} };
		res = {};
		next = jasmine.createSpy( 'next' );
	} );

	describe( 'When bypass is true', () => {

		describe( 'When a datahub dev token is provided', () => {
		
			it( 'Should use the dev token', () => {
		
				const myToken = 'abc-123';
				const ssoBypass = proxyquire( modulePath, {
					'../config': {
						sso: { bypass: true },
						datahub: {
							token: myToken
						}
					}
				} );

				ssoBypass( req, res, next );

				expect( req.session.ssoToken ).toEqual( myToken );
				expect( next ).toHaveBeenCalled();
			} );
		} );

		describe( 'When a token is not provided', () => {
		
			it( 'Should add an ssoToken and call next', () => {

				const ssoBypass = proxyquire( modulePath, {
					'../config': {
						sso: { bypass: true },
						datahub: { token: '' }
					}
				} );

				ssoBypass( req, res, next );

				expect( req.session.ssoToken ).toEqual( 'ssobypass' );
				expect( next ).toHaveBeenCalled();
			} );
		} );
	} );

	describe( 'When bypass is false', () => {

		it( 'Should not add an ssoToken and call next', () => {

			const ssoBypass = proxyquire( modulePath, {
				'../config': {
					sso: { bypass: false }
				}
			} );

			ssoBypass( req, res, next );

			expect( req.session.ssoToken ).not.toBeDefined();
			expect( next ).toHaveBeenCalled();
		} );
	} );
} );
