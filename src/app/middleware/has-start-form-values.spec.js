const proxyquire = require( 'proxyquire' );
const modulePath = './has-start-form-values';

const startUrlResponse = 'a-start-url';

describe( 'hasStartFormValues middleware', () => {

	let req;
	let res;
	let next;
	let start;
	let middleware;

	beforeEach( () => {

		req = {
			session: {},
			params: {
				reportId: '2'
			}
		};
		res = {
			redirect: jasmine.createSpy( 'res.redirect' )
		};
		next = jasmine.createSpy( 'next' );
		start = jasmine.createSpy( 'urls.report.start' ).and.callFake( () => startUrlResponse );

		middleware = proxyquire( modulePath, {
			'../lib/urls': { report: { start	} }
		} );
	} );

	describe( 'When there is a startFormValues object in the session', () => {
		it( 'Should call next', () => {

			req.session.startFormValues = {
				status: 1,
				emergency: 2
			};

			middleware( req, res, next );

			expect( next ).toHaveBeenCalled();
		} );
	} );

	describe( 'When there is not a startFormValues object in the session', () => {
		it( 'Should redirect to the start page', () => {

			middleware( req, res, next );

			expect( next ).not.toHaveBeenCalled();
			expect( start ).toHaveBeenCalledWith( req.params.reportId );
			expect( res.redirect ).toHaveBeenCalledWith( startUrlResponse );
		} );
	} );
} );
