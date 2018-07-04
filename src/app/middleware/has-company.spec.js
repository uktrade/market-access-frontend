const proxyquire = require( 'proxyquire' );
const modulePath = './has-company';

const companySearchUrlResponse = 'a-url';

describe( 'hasCompany middleware', () => {

	let req;
	let res;
	let next;
	let companySearch;
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
		companySearch = jasmine.createSpy( 'urls.report.companySearch' ).and.callFake( () => companySearchUrlResponse );

		middleware = proxyquire( modulePath, {
			'../lib/urls': { report: { companySearch	} }
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

	describe( 'When there is a reportCompany in the session', () => {
		it( 'Should call next', () => {

			req.session.reportCompany = {
				id: 1,
				name: 'test'
			};

			middleware( req, res, next );

			expect( next ).toHaveBeenCalled();
		} );
	} );

	describe( 'When there is not a req.report object or a reportCompany in the session', () => {
		it( 'Should redirect to the company search page', () => {

			middleware( req, res, next );

			expect( next ).not.toHaveBeenCalled();
			expect( companySearch ).toHaveBeenCalledWith( req.params.reportId );
			expect( res.redirect ).toHaveBeenCalledWith( companySearchUrlResponse );
		} );
	} );
} );
