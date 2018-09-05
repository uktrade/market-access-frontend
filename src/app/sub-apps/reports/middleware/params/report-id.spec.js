const proxyquire = require( 'proxyquire' );
const modulePath = './report-id';

describe( 'Report Id param middleware', () => {

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
			reports: { get: jasmine.createSpy( 'backend.reports.get' ) }
		};

		middleware = proxyquire( modulePath, {
			'../../../../lib/backend-service': backend
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

						req.params = { reportId };

						await middleware( req, res, next );

						expect( backend.reports.get ).toHaveBeenCalledWith( req, reportId );
						expect( req.session.report ).not.toBeDefined();
						expect( req.report ).toEqual( getReportResponse );
						expect( res.locals.report ).toEqual( getReportResponse );
						expect( next ).toHaveBeenCalledWith();
					} );
				} );

				describe( 'When the response is not a success', () => {
					it( 'Should call next with an error', async () => {

						req.params.reportId = '12';

						backend.reports.get.and.callFake( () => Promise.resolve( {
							response: { isSuccess: false },
							body: { data: true }
						} ) );

						await middleware( req, res, next );

						expect( req.session.report ).not.toBeDefined();
						expect( req.report ).not.toBeDefined();
						expect( res.locals.report ).not.toBeDefined();
						expect( next ).toHaveBeenCalledWith( new Error( 'Error response getting report' ) );
					} );
				} );

				describe( 'When the call throws an error', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'Something broke' );

						req.params.reportId = '12';

						backend.reports.get.and.callFake( () => Promise.reject( err ) );

						await middleware( req, res, next );

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

					req.params.reportId = '12';
					req.session.report = sessionReport;

					await middleware( req, res, next );

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

				req.params.reportId = '1234567891123456789112345678911234567891123456789112345678911';

				await middleware( req, res, next );

				expect( res.locals.reportId ).not.toBeDefined();
				expect( req.report ).not.toBeDefined();
				expect( next ).toHaveBeenCalledWith( new Error( 'Invalid reportId' ) );
			} );
		} );
	} );

	describe( 'When it is a word', () => {
		describe( 'When the word is "new"', () => {
			it( 'Should delete the reportId param and call next', async () => {

				req.params.reportId = 'new';

				await middleware( req, res, next );

				expect( req.params.reportId ).not.toBeDefined();
				expect( res.locals.reportId ).not.toBeDefined();
				expect( next ).toHaveBeenCalledWith();
			} );
		} );

		describe( 'Any other word', () => {
			it( 'Should call next with an error', async () => {

				req.params.reportId = 'abc_zyx';

				await middleware( req, res, next );

				expect( res.locals.reportId ).not.toBeDefined();
				expect( next ).toHaveBeenCalledWith( new Error( 'Invalid reportId' ) );
			} );
		} );
	} );
} );
