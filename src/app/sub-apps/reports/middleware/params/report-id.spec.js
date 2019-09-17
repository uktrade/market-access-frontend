const proxyquire = require( 'proxyquire' );
const HttpResponseError = require( '../../../../lib/HttpResponseError' );

const modulePath = './report-id';

describe( 'Report Id param middleware', () => {

	let req;
	let res;
	let next;
	let backend;
	let middleware;
	let urls;

	beforeEach( () => {

		({ req, res, next } = jasmine.helpers.mocks.middleware());
		req.params.reportId = 'default';
		backend = {
			reports: { get: jasmine.createSpy( 'backend.reports.get' ) },
			barriers: { get: jasmine.createSpy( 'backend.barriers.get' ) },
		};
		urls = {
			barriers: { detail: jasmine.createSpy( 'urls.barriers.detail' ) },
		};

		middleware = proxyquire( modulePath, {
			'../../../../lib/backend-service': backend,
			'../../../../lib/urls': urls,
		} );
	} );

	describe( 'When it is a number', () => {
		describe( 'When the number is less than 10 digits', () => {
			describe( 'When there is not a report in the session', () => {
				describe( 'When the response is a success', () => {
					it( 'Should save the report to the session', async () => {

						const reportId = '123';
						const getReportResponse = { id: 1 };

						backend.reports.get.and.callFake( () => Promise.resolve( {
							response: {
								isSuccess: true,
							},
							body: getReportResponse
						} ) );

						await middleware( req, res, next, reportId );

						expect( backend.reports.get ).toHaveBeenCalledWith( req, reportId );
						expect( req.session.report ).not.toBeDefined();
						expect( req.report ).toEqual( getReportResponse );
						expect( res.locals.report ).toEqual( getReportResponse );
						expect( next ).toHaveBeenCalledWith();
					} );
				} );

				describe( 'When the response is not a success', () => {
					describe( 'When the statusCode is 500', () => {
						it( 'Should call next with an error', async () => {

							backend.reports.get.and.callFake( () => Promise.resolve( {
								response: { isSuccess: false, statusCode: 500 },
								body: { data: true }
							} ) );

							await middleware( req, res, next, '1' );

							expect( req.session.report ).not.toBeDefined();
							expect( req.report ).not.toBeDefined();
							expect( res.locals.report ).not.toBeDefined();
							expect( next ).toHaveBeenCalled();
							expect( next.calls.argsFor( 0 )[ 0 ] instanceof HttpResponseError ).toEqual( true );
						} );
					} );

					describe( 'When the statusCode is 404', () => {

						beforeEach( () => {

							backend.reports.get.and.callFake( () => Promise.resolve( {
								response: { isSuccess: false, statusCode: 404 },
								body: { data: true }
							} ) );
						} );

						describe( 'When the barrier returns a success', () => {
							it( 'Redirects to the barrier detail', async () => {

								const detailResponse = 'barrier/detail';

								backend.barriers.get.and.callFake( () => Promise.resolve( {
									response: { isSuccess: true, statusCode: 200 },
									body: { data: true }
								} ) );

								urls.barriers.detail.and.returnValue( detailResponse );

								await middleware( req, res, next, '2' );

								expect( req.session.report ).not.toBeDefined();
								expect( req.report ).not.toBeDefined();
								expect( res.locals.report ).not.toBeDefined();
								expect( next ).not.toHaveBeenCalled();
								expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
							} );
						} );

						describe( 'When the barrier does not return a success', () => {
							it( 'Should call next with an error', async () => {

								backend.barriers.get.and.callFake( () => Promise.resolve( {
									response: { isSuccess: false, statusCode: 404 },
									body: { data: true }
								} ) );

								await middleware( req, res, next, '2' );

								const err = next.calls.argsFor( 0 )[ 0 ];

								expect( req.session.report ).not.toBeDefined();
								expect( req.report ).not.toBeDefined();
								expect( res.locals.report ).not.toBeDefined();
								expect( next ).toHaveBeenCalled();
								expect( err instanceof HttpResponseError ).toEqual( true );
								expect( err.code ).toEqual( 'REPORT_NOT_FOUND' );
								expect( next.calls.count() ).toEqual( 1 );
							} );
						} );
					} );
				} );

				describe( 'When the call throws an error', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'Something broke' );

						backend.reports.get.and.callFake( () => Promise.reject( err ) );

						await middleware( req, res, next, '2' );

						expect( next ).toHaveBeenCalledWith( err );
						expect( req.session.report ).not.toBeDefined();
						expect( req.report ).not.toBeDefined();
						expect( res.locals.report ).not.toBeDefined();
					} );
				} );
			} );

			describe( 'When there is a report in the session', () => {
				it( 'Should put the report in the req and locals and delete it from the session', async () => {

					const sessionReport = { id: 1, name: 2 };

					req.session.report = sessionReport;

					await middleware( req, res, next, '3' );

					expect( backend.reports.get ).not.toHaveBeenCalled();
					expect( req.report ).toEqual( sessionReport );
					expect( res.locals.report ).toEqual( sessionReport );
					expect( req.session.report ).not.toBeDefined();
					expect( next ).toHaveBeenCalledWith();
				} );
			} );
		} );

		describe( 'When the number is more than 60 digits', () => {
			it( 'Should call next with an error', async () => {

				const reportId = '1234567891123456789112345678911234567891123456789112345678911';

				await middleware( req, res, next, reportId );

				expect( res.locals.reportId ).not.toBeDefined();
				expect( req.report ).not.toBeDefined();
				expect( next ).toHaveBeenCalledWith( new Error( 'Invalid reportId' ) );
			} );
		} );
	} );

	describe( 'When it is a word', () => {
		describe( 'When the word is "new"', () => {
			it( 'Should delete the reportId param and call next', async () => {

				await middleware( req, res, next, 'new' );

				expect( req.params.reportId ).not.toBeDefined();
				expect( res.locals.reportId ).not.toBeDefined();
				expect( next ).toHaveBeenCalledWith();
			} );
		} );

		describe( 'Any other word', () => {
			it( 'Should call next with an error', async () => {

				await middleware( req, res, next, 'abc_zyx' );

				expect( res.locals.reportId ).not.toBeDefined();
				expect( next ).toHaveBeenCalledWith( new Error( 'Invalid reportId' ) );
			} );
		} );
	} );
} );
