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

		function checkResults( dataPath, expected ){

			describe( 'When all counts have a number', () => {

				beforeEach( () => {

					backend.getCounts.and.callFake( () => Promise.resolve( {
						response: { isSuccess: true },
						body: jasmine.helpers.getFakeData( dataPath )
					} ) );
				} );

				describe( 'When the user has a country', () => {
					it( 'Should add a country property', async () => {

						req.user = { country: { id: 123 } };

						await middleware( req, res, next );

						expect( res.locals.dashboard.tabs.all.skip ).toEqual( true );

						expect( res.locals.dashboard.tabs.country ).toBeDefined();
						expect( res.locals.dashboard.tabs.country.skip ).toEqual( false );
						expect( res.locals.dashboard.tabs.country.count ).toEqual( expected.country.barriers );

						expect( res.locals.dashboard.tabs.unfinished ).toBeDefined();
						expect( res.locals.dashboard.tabs.unfinished.skip ).toEqual( false );
						expect( res.locals.dashboard.tabs.unfinished.count ).toEqual( expected.country.reports );
					} );
				} );

				describe( 'When the user does NOT have a country', () => {
					describe( 'When there are paused numbers', () => {
						it( 'Should add an all property with the open and paused numbers added together', async () => {

							await middleware( req, res, next );

							expect( res.locals.dashboard.tabs.country.skip ).toEqual( true );

							expect( res.locals.dashboard.tabs.all ).toBeDefined();
							expect( res.locals.dashboard.tabs.all.skip ).toEqual( false );
							expect( res.locals.dashboard.tabs.all.count ).toEqual( expected.all.barriers );

							expect( res.locals.dashboard.tabs.unfinished ).toBeDefined();
							expect( res.locals.dashboard.tabs.unfinished.skip ).toEqual( false );
							expect( res.locals.dashboard.tabs.unfinished.count ).toEqual( expected.all.reports );
						} );
					} );
				} );
			} );

			describe( 'When unfinished has a 0 count', () => {

				beforeEach( () => {

					const body = jasmine.helpers.getFakeData( dataPath );

					body.reports = 0;
					body.user.country.reports = 0;

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
						expect( res.locals.dashboard.tabs.country.count ).toEqual( expected.country.barriers );

						expect( res.locals.dashboard.tabs.unfinished ).toBeDefined();
						expect( res.locals.dashboard.tabs.unfinished.skip ).toEqual( true );
						expect( res.locals.dashboard.tabs.unfinished.count ).toEqual( 0 );
					} );
				} );

				describe( 'When the user does NOT have a country', () => {
					it( 'Should add an all property with the open and paused numbers added together', async () => {

						await middleware( req, res, next );

						expect( res.locals.dashboard.tabs.country.skip ).toEqual( true );

						expect( res.locals.dashboard.tabs.all ).toBeDefined();
						expect( res.locals.dashboard.tabs.all.skip ).toEqual( false );
						expect( res.locals.dashboard.tabs.all.count ).toEqual( expected.all.barriers );

						expect( res.locals.dashboard.tabs.unfinished ).toBeDefined();
						expect( res.locals.dashboard.tabs.unfinished.skip ).toEqual( true );
						expect( res.locals.dashboard.tabs.unfinished.count ).toEqual( 0 );
					} );
				} );
			} );
		}

		describe( 'With the current API response', () => {

			const dataPath = '/backend/counts/';
			const data = jasmine.helpers.getFakeData( dataPath );

			checkResults( dataPath, {
				country: {
					barriers: ( data.user.country.barriers.open + data.user.country.barriers.paused ),
					reports: data.user.country.reports,
				},
				all: {
					barriers: ( data.barriers.open + data.barriers.paused ),
					reports: data.reports
				}
			} );
		} );

		describe( 'With the old API response', () => {

			const dataPath = '/backend/counts/index.old';
			const data = jasmine.helpers.getFakeData( dataPath );

			checkResults( dataPath, {
				country: {
					barriers: data.user.country.barriers,
					reports: data.user.country.reports,
				},
				all: {
					barriers: data.barriers.open,
					reports: data.reports
				}
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
