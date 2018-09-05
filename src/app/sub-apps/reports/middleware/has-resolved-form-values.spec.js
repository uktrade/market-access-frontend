const proxyquire = require( 'proxyquire' );
const modulePath = './has-resolved-form-values';

const isResolvedUrlResponse = 'a-url';

describe( 'hasResolvedFormValues middleware', () => {

	let req;
	let res;
	let next;
	let isResolved;
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
		isResolved = jasmine.createSpy( 'urls.reports.isResolved' ).and.callFake( () => isResolvedUrlResponse );

		middleware = proxyquire( modulePath, {
			'../../../lib/urls': { reports: { isResolved	} }
		} );
	} );

	describe( 'When there is a req.report object', () => {
		it( 'Should call next', () => {

			req.report = {
				id: 1,
				state: 2
			};

			middleware( req, res, next );

			expect( next ).toHaveBeenCalled();
		} );
	} );

	describe( 'When isResolvedFormValues is in the session', () => {
		it( 'Should call next', () => {

			req.session.isResolvedFormValues = {
				id: 1,
				name: 'test'
			};

			middleware( req, res, next );

			expect( next ).toHaveBeenCalled();
		} );
	} );

	describe( 'When there is not a req.report object or isResolvedFormValues in the session', () => {
		it( 'Should redirect to the isResolved page', () => {

			middleware( req, res, next );

			expect( next ).not.toHaveBeenCalled();
			expect( isResolved ).toHaveBeenCalledWith( req.params.reportId );
			expect( res.redirect ).toHaveBeenCalledWith( isResolvedUrlResponse );
		} );
	} );
} );
