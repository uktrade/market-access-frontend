const proxyquire = require( 'proxyquire' );
const modulePath = './has-barrier-type-category';

const typeUrlResponse = 'a-type-url';

describe( 'hasBarrierTypeCategory middleware', () => {

	let req;
	let res;
	let next;
	let type;
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
		type = jasmine.createSpy( 'urls.reports.type' ).and.callFake( () => typeUrlResponse );

		middleware = proxyquire( modulePath, {
			'../../../lib/urls': { reports: { type	} }
		} );
	} );

	describe( 'When there is a typeCategoryValues object in the session', () => {
		it( 'Should call next', () => {

			req.session.typeCategoryValues = {
				category: 1
			};

			middleware( req, res, next );

			expect( next ).toHaveBeenCalled();
		} );
	} );

	describe( 'When there is not a typeCategoryValues object in the session', () => {
		it( 'Should redirect to the type page', () => {

			middleware( req, res, next );

			expect( next ).not.toHaveBeenCalled();
			expect( type ).toHaveBeenCalledWith( req.params.reportId );
			expect( res.redirect ).toHaveBeenCalledWith( typeUrlResponse );
		} );
	} );
} );
