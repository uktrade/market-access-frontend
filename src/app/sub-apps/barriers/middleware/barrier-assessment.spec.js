const proxyquire = require( 'proxyquire' );
const HttpResponseError = require( '../../../lib/HttpResponseError' );

const { mocks, getFakeData } = jasmine.helpers;

const modulePath = './barrier-assessment';

describe( 'Barrier assessment middleware', () => {

	let req;
	let res;
	let next;
	let middleware;
	let backend;

	beforeEach( () => {

		({ req, res, next } = mocks.middleware());

		backend = {
			barriers: {
				assessment: {
					get: jasmine.createSpy( 'backend.barriers.assessment.get' ),
				}
			}
		};

		req.barrier = getFakeData( '/backend/barriers/barrier' );

		middleware = proxyquire( modulePath, {
			'../../../lib/backend-service': backend,
		} );
	} );

	afterEach( () => {

		expect( backend.barriers.assessment.get ).toHaveBeenCalledWith( req, req.barrier.id );
	} );

	describe( 'When the backend call rejects', () => {
		it( 'Calls next with an error', async () => {

			const err = new Error( 'A backend assessment issue' );

			backend.barriers.assessment.get.and.returnValue( Promise.reject( err ) );
			await middleware( req, res, next );

			expect( next ).toHaveBeenCalledWith( err );
		} );
	} );

	describe( 'When the backend resolves with a 500', () => {
		it( 'Calls next with an error', async () => {

			backend.barriers.assessment.get.and.returnValue( mocks.request( 500 ) );

			await middleware( req, res, next );

			expect( next ).toHaveBeenCalled();
			expect( next.calls.argsFor( 0 )[ 0 ] instanceof HttpResponseError ).toEqual( true );
		} );
	} );

	describe( 'When the backend resolves with a 404', () => {
		it( 'Calls next', async () => {

			backend.barriers.assessment.get.and.returnValue( mocks.request( 404 ) );

			await middleware( req, res, next );

			expect( req.assessment ).not.toBeDefined();
			expect( next ).toHaveBeenCalledWith();
		} );
	} );

	describe( 'When the backend resolves with a 200', () => {
		it( 'Calls next with the assessment data', async () => {

			const assessment = getFakeData( '/backend/barriers/assessment' );

			backend.barriers.assessment.get.and.returnValue( mocks.request( 200, assessment ) );

			await middleware( req, res, next );

			expect( req.assessment ).toEqual( assessment );
			expect( next ).toHaveBeenCalled();
		} );
	} );
} );
