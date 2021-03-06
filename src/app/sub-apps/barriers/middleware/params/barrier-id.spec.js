const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const HttpResponseError = require( '../../../../lib/HttpResponseError' );
const modulePath = './barrier-id';

describe( 'Barrier Id param middleware', () => {

	let req;
	let res;
	let next;
	let backend;
	let middleware;

	beforeEach( () => {

		req = { session: {} };
		res = {
			locals: {},
			status: jasmine.createSpy( 'res.status' ),
			render: jasmine.createSpy( 'res.render' ),
		};
		next = jasmine.createSpy( 'next' );
		backend = {
			barriers: { get: jasmine.createSpy( 'backend.barriers.get' ) }
		};

		middleware = proxyquire( modulePath, {
			'../../../../lib/backend-service': backend
		} );
	} );

	describe( 'When it is a valid uuid', () => {

		let barrierId;

		beforeEach( () => {

			barrierId = uuid();
		} );

		describe( 'When the response is a success', () => {
			it( 'Should put the barrier in the req and locals', async () => {

				const getBarrierResponse = { id: 1 };

				backend.barriers.get.and.callFake( () => Promise.resolve( {
					response: {
						isSuccess: true,
					},
					body: getBarrierResponse
				} ) );

				await middleware( req, res, next, barrierId );

				expect( backend.barriers.get ).toHaveBeenCalledWith( req, barrierId );
				expect( req.barrier ).toEqual( getBarrierResponse );
				expect( res.locals.barrier ).toEqual( getBarrierResponse );
				expect( next ).toHaveBeenCalledWith();
			} );
		} );

		describe( 'When the response is not a success', () => {
			it( 'Should call next with an error', async () => {

				backend.barriers.get.and.callFake( () => Promise.resolve( {
					response: { isSuccess: false },
					body: { data: true }
				} ) );

				await middleware( req, res, next, barrierId );

				expect( req.barrier ).not.toBeDefined();
				expect( res.locals.barrier ).not.toBeDefined();
				expect( next ).toHaveBeenCalled();
				expect( next.calls.count() ).toEqual( 1 );
				expect( next.calls.argsFor( 0 )[ 0 ] instanceof HttpResponseError ).toEqual( true );
			} );

			describe( 'When the response statusCode is 404', () => {
				it( 'Should render the 404 page', async () => {

					backend.barriers.get.and.callFake( () => Promise.resolve( {
						response: { isSuccess: false, statusCode: 404 }
					} ) );

					await middleware( req, res, next, barrierId );

					expect( req.barrier ).not.toBeDefined();
					expect( res.locals.barrier ).not.toBeDefined();
					expect( next ).not.toHaveBeenCalled();
					expect( res.status ).toHaveBeenCalledWith( 404 );
					expect( res.render ).toHaveBeenCalledWith( 'error/404' );
				} );
			} );
		} );

		describe( 'When the call throws an error', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'Something broke' );

				backend.barriers.get.and.callFake( () => Promise.reject( err ) );

				await middleware( req, res, next, barrierId );

				expect( next ).toHaveBeenCalledWith( err );
				expect( next.calls.count() ).toEqual( 1 );
				expect( req.barrier ).not.toBeDefined();
				expect( res.locals.barrier ).not.toBeDefined();
			} );
		} );
	} );

	describe( 'When it is not a valid uuid', () => {
		it( 'Should call next with an error', async () => {

			await middleware( req, res, next, 'abc_def' );

			expect( res.locals.barrier ).not.toBeDefined();
			expect( req.barrier ).not.toBeDefined();
			expect( next ).toHaveBeenCalledWith( new Error( 'Invalid barrierId' ) );
			expect( next.calls.count() ).toEqual( 1 );
		} );
	} );
} );
