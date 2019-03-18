const proxyquire = require( 'proxyquire' );
const modulePath = './has-country-form-values';

const countryUrlResponse = 'a-url';

describe( 'hasCountryFormValues middleware', () => {

	let req;
	let res;
	let next;
	let country;
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
		isResolved = jasmine.createSpy( 'urls.reports.country' ).and.callFake( () => countryUrlResponse );

		middleware = proxyquire( modulePath, {
			'../../../lib/urls': { reports: { country	} }
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

	describe( 'When countryFormValues is in the session', () => {
		it( 'Should call next', () => {

			req.session.countryFormValues = {
				id: 1,
				name: 'test'
			};

			middleware( req, res, next );

			expect( next ).toHaveBeenCalled();
		} );
	} );

	describe( 'When there is not a req.report object or countryFormValues in the session', () => {
		it( 'Should redirect to the country page', () => {

			middleware( req, res, next );

			expect( next ).not.toHaveBeenCalled();
			expect( country ).toHaveBeenCalledWith( req.params.reportId );
			expect( res.redirect ).toHaveBeenCalledWith( countryUrlResponse );
		} );
	} );
} );
