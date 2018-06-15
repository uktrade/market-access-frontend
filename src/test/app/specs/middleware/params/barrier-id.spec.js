const proxyquire = require( 'proxyquire' );
const modulePath = '../../../../../app/middleware/params/barrier-id';

describe( 'Barrier Id param middleware', () => {

	let req;
	let res;
	let next;
	let backend;
	let middleware;

	beforeEach( () => {

		req = { params: {}, session: {} };
		res = { locals: {} };
		next = jasmine.createSpy( 'next' );
		backend = {
			getBarrier: jasmine.createSpy( 'backend.getBarrier' )
		};

		middleware = proxyquire( modulePath, {
			'../../lib/backend-service': backend
		} );
	} );

	describe( 'When it is a number', () => {
		describe( 'When the number is less than 10 digits', () => {
			describe( 'When there is not a barrier in the session', () => {
				describe( 'When the response is a success', () => {
					it( 'Should save the barrier to the session', async () => {

						const barrierId = '123';
						const getBarrierResponse = { id: 1 };

						backend.getBarrier.and.callFake( () => Promise.resolve( {
							response: {
								isSuccess: true,
							},
							body: getBarrierResponse
						} ) );

						req.params = { barrierId };

						await middleware( req, res, next );

						expect( backend.getBarrier ).toHaveBeenCalledWith( req, barrierId );
						expect( req.session.barrier ).toEqual( getBarrierResponse );
						expect( req.barrier ).toEqual( getBarrierResponse );
						expect( res.locals.barrier ).toEqual( getBarrierResponse );
						expect( next ).toHaveBeenCalledWith();
					} );
				} );

				describe( 'When the response is not a success', () => {
					it( 'Should call next with an error', async () => {

						req.params.barrierId = '12';

						backend.getBarrier.and.callFake( () => Promise.resolve( {
							response: { isSuccess: false },
							body: { data: true }
						} ) );

						await middleware( req, res, next );

						expect( req.session.barrier ).not.toBeDefined();
						expect( req.barrier ).not.toBeDefined();
						expect( res.locals.barrier ).not.toBeDefined();
						expect( next ).toHaveBeenCalledWith( new Error( 'Error response getting barrier' ) );
					} );
				} );

				describe( 'When the call throws an error', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'Something broke' );

						req.params.barrierId = '12';

						backend.getBarrier.and.callFake( () => Promise.reject( err ) );

						await middleware( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
						expect( req.session.barrier ).not.toBeDefined();
						expect( req.barrier ).not.toBeDefined();
						expect( res.locals.barrier ).not.toBeDefined();
					} );
				} );
			} );

			describe( 'When there is a barrier in the session', () => {
				it( 'Should put the barrier in the req and locals', async () => {

					const sessionBarrier = { id: 1, name: 2 };

					req.params.barrierId = '12';
					req.session.barrier = sessionBarrier;

					await middleware( req, res, next );

					expect( backend.getBarrier ).not.toHaveBeenCalled();
					expect( req.barrier ).toEqual( sessionBarrier );
					expect( res.locals.barrier ).toEqual( sessionBarrier );
					expect( next ).toHaveBeenCalledWith();
				} );
			} );
		} );

		describe( 'When the number is more than 10 digits', () => {
			it( 'Should call next with an error', async () => {

				req.params.barrierId = '1234567891011';

				await middleware( req, res, next );

				expect( res.locals.barrierId ).not.toBeDefined();
				expect( req.barrier ).not.toBeDefined();
				expect( next ).toHaveBeenCalledWith( new Error( 'Invalid barrierId' ) );
			} );
		} );
	} );

	describe( 'When it is a word', () => {
		it( 'Should call next with an error', async () => {

			req.params.barrierId = 'abc';

			await middleware( req, res, next );

			expect( res.locals.barrierId ).not.toBeDefined();
			expect( next ).toHaveBeenCalledWith( new Error( 'Invalid barrierId' ) );
		} );
	} );
} );
