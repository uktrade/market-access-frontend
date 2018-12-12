const proxyquire = require( 'proxyquire' );
const modulePath = './dashboard-data';

describe( 'Dashboard tabs', () => {

	let middleware;
	let req;
	let res;
	let next;
	let backend;
	let reporter;

	beforeEach( () => {

		req = {};
		res = { locals: {} };
		next = jasmine.createSpy( 'next' );
		backend = {
			getCounts: jasmine.createSpy( 'backend.getCounts' )
		};
		reporter = {
			captureException: jasmine.createSpy( 'reporter.captureException' ),
			message: jasmine.createSpy( 'reporter.message' )
		};

		middleware = proxyquire( modulePath, {
			'../lib/backend-service': backend,
			'../lib/reporter': reporter
		} );
	} );

	afterEach( () => {

		expect( next ).toHaveBeenCalledWith();
	} );

	describe( 'When the backend returns a success', () => {

		afterEach( () => {

			expect( reporter.message ).not.toHaveBeenCalled();
			expect( reporter.captureException ).not.toHaveBeenCalled();
		} );

		describe( 'When all counts have a number', () => {

			beforeEach( () => {

				backend.getCounts.and.callFake( () => Promise.resolve( {
					response: { isSuccess: true },
					body: jasmine.helpers.getFakeData( '/backend/counts/' )
				} ) );
			} );

			describe( 'When the user has a country', () => {
				it( 'Should add a country property', async () => {

					req.user = { country: { id: 123 } };

					await middleware( req, res, next );

					expect( res.locals.dashboard.tabs.all.skip ).toEqual( true );

					expect( res.locals.dashboard.tabs.country ).toBeDefined();
					expect( res.locals.dashboard.tabs.country.skip ).toEqual( false );
					expect( res.locals.dashboard.tabs.country.count ).toEqual( 9 );

					expect( res.locals.dashboard.tabs.unfinished ).toBeDefined();
					expect( res.locals.dashboard.tabs.unfinished.skip ).toEqual( false );
					expect( res.locals.dashboard.tabs.unfinished.count ).toEqual( 5 );
				} );
			} );

			describe( 'When the user does NOT have a country', () => {
				it( 'Should add an all property', async () => {

					await middleware( req, res, next );

					expect( res.locals.dashboard.tabs.country.skip ).toEqual( true );

					expect( res.locals.dashboard.tabs.all ).toBeDefined();
					expect( res.locals.dashboard.tabs.all.skip ).toEqual( false );
					expect( res.locals.dashboard.tabs.all.count ).toEqual( 22 );

					expect( res.locals.dashboard.tabs.unfinished ).toBeDefined();
					expect( res.locals.dashboard.tabs.unfinished.skip ).toEqual( false );
					expect( res.locals.dashboard.tabs.unfinished.count ).toEqual( 15 );
				} );
			} );
		} );

		describe( 'When unfinished has a 0 count', () => {

			beforeEach( () => {

				const body = jasmine.helpers.getFakeData( '/backend/counts/' );

				body.reports = 0;

				backend.getCounts.and.callFake( () => Promise.resolve( {
					response: { isSuccess: true },
					body
				} ) );
			} );

			describe( 'When the user has a country', () => {
				it( 'Should add a country property', async () => {

					req.user = { country: { id: 123 } };

					await middleware( req, res, next );

					expect( res.locals.dashboard.tabs.all.skip ).toEqual( true );

					expect( res.locals.dashboard.tabs.country ).toBeDefined();
					expect( res.locals.dashboard.tabs.country.skip ).toEqual( false );
					expect( res.locals.dashboard.tabs.country.count ).toEqual( 9 );

					expect( res.locals.dashboard.tabs.unfinished ).toBeDefined();
					expect( res.locals.dashboard.tabs.unfinished.skip ).toEqual( false );
					expect( res.locals.dashboard.tabs.unfinished.count ).toEqual( 5 );
				} );
			} );

			describe( 'When the user does NOT have a country', () => {
				it( 'Should add an all property', async () => {

					await middleware( req, res, next );

					expect( res.locals.dashboard.tabs.country.skip ).toEqual( true );

					expect( res.locals.dashboard.tabs.all ).toBeDefined();
					expect( res.locals.dashboard.tabs.all.skip ).toEqual( false );
					expect( res.locals.dashboard.tabs.all.count ).toEqual( 22 );

					expect( res.locals.dashboard.tabs.unfinished ).toBeDefined();
					expect( res.locals.dashboard.tabs.unfinished.skip ).toEqual( true );
					expect( res.locals.dashboard.tabs.unfinished.count ).toEqual( 0 );
				} );
			} );
		} );
	} );

	describe( 'When the backend returns a 500 response', () => {

		beforeEach( () => {

			backend.getCounts.and.callFake( () => Promise.resolve( {
				response: { isSuccess: false, statusCode: 500 }
			} ) );
		} );

		afterEach( () => {

			expect( reporter.message ).toHaveBeenCalledWith( 'Unable to get counts, got 500 from backend' );
			expect( reporter.captureException ).not.toHaveBeenCalled();
		} );

		describe( 'When the user has a country', () => {
			it( 'Should add a country property', async () => {

				req.user = { country: { id: 123 } };

				await middleware( req, res, next );

				expect( res.locals.dashboard.tabs.all.skip ).toEqual( true );

				expect( res.locals.dashboard.tabs.country ).toBeDefined();
				expect( res.locals.dashboard.tabs.country.skip ).toEqual( false );
				expect( res.locals.dashboard.tabs.country.count ).not.toBeDefined();

				expect( res.locals.dashboard.tabs.unfinished ).toBeDefined();
				expect( res.locals.dashboard.tabs.unfinished.skip ).toEqual( false );
				expect( res.locals.dashboard.tabs.unfinished.count ).not.toBeDefined();
			} );
		} );

		describe( 'When the user does NOT have a country', () => {
			it( 'Should add an all property', async () => {

				await middleware( req, res, next );

				expect( res.locals.dashboard.tabs.country.skip ).toEqual( true );

				expect( res.locals.dashboard.tabs.all ).toBeDefined();
				expect( res.locals.dashboard.tabs.all.skip ).toEqual( false );
				expect( res.locals.dashboard.tabs.all.count ).not.toBeDefined();

				expect( res.locals.dashboard.tabs.unfinished ).toBeDefined();
				expect( res.locals.dashboard.tabs.unfinished.skip ).toEqual( false );
				expect( res.locals.dashboard.tabs.unfinished.count ).not.toBeDefined();
			} );
		} );
	} );

	describe( 'When the backend returns an error', () => {

		let err;

		beforeEach( () => {

			err = new Error( 'something bad happened' );
			backend.getCounts.and.callFake( () => Promise.reject( err ) );
		} );

		afterEach( () => {

			expect( reporter.message ).not.toHaveBeenCalled();
			expect( reporter.captureException ).toHaveBeenCalledWith( err );
		} );

		describe( 'When the user has a country', () => {
			it( 'Should add a country property', async () => {

				req.user = { country: { id: 123 } };

				await middleware( req, res, next );

				expect( res.locals.dashboard.tabs.all.skip ).toEqual( true );

				expect( res.locals.dashboard.tabs.country ).toBeDefined();
				expect( res.locals.dashboard.tabs.country.skip ).toEqual( false );
				expect( res.locals.dashboard.tabs.country.count ).not.toBeDefined();

				expect( res.locals.dashboard.tabs.unfinished ).toBeDefined();
				expect( res.locals.dashboard.tabs.unfinished.skip ).toEqual( false );
				expect( res.locals.dashboard.tabs.unfinished.count ).not.toBeDefined();
			} );
		} );

		describe( 'When the user does NOT have a country', () => {
			it( 'Should add an all property', async () => {

				await middleware( req, res, next );

				expect( res.locals.dashboard.tabs.country.skip ).toEqual( true );

				expect( res.locals.dashboard.tabs.all ).toBeDefined();
				expect( res.locals.dashboard.tabs.all.skip ).toEqual( false );
				expect( res.locals.dashboard.tabs.all.count ).not.toBeDefined();

				expect( res.locals.dashboard.tabs.unfinished ).toBeDefined();
				expect( res.locals.dashboard.tabs.unfinished.skip ).toEqual( false );
				expect( res.locals.dashboard.tabs.unfinished.count ).not.toBeDefined();
			} );
		} );
	} );
} );
