const proxyquire = require( 'proxyquire' );

const modulePath = './index';

describe( 'Report controllers', () => {

	let controller;
	let controllers;
	let req;
	let res;
	let next;
	let csrfToken;
	let backend;
	let urls;
	let form;
	let metadata;
	let reportDetailViewModel;
	let reportsViewModel;

	beforeEach( () => {

		( { req, res, next, csrfToken } = jasmine.helpers.mocks.middleware() );

		form = {
			hasErrors: jasmine.createSpy( 'form.hasErrors' ),
		};

		metadata = {
			reportTaskList: [ { a: 1, b: 2 }, { c: 3, d: 4 } ],
		};

		backend = {
			reports: {
				getAll: jasmine.createSpy( 'backend.reports.getAll' ),
				getForCountry: jasmine.createSpy( 'backend.reports.getForCountry' ),
				submit: jasmine.createSpy( 'backend.reports.submit' ),
			}
		};

		urls = {
			reports: {
				detail: jasmine.createSpy( 'urls.reports.detail' ),

			},
			barriers: {
				detail: jasmine.createSpy( 'urls.barriers.detail' ),
			}
		};

		reportDetailViewModel = jasmine.createSpy( 'reportDetailViewModel' );
		reportsViewModel = jasmine.createSpy( 'reportsViewModel' );

		const additionalControllers = {

			'./start': 'start',
			'./is-resolved': 'isResolved',
			'./country': 'country',
			'./has-admin-areas': 'hasAdminAreas',
			'./admin-areas': 'adminAreas',
			'./has-sectors': 'hasSectors',
			'./sectors': 'sectors',
			'./about-problem': 'aboutProblem',
			'./summary': 'summary',
		};

		controllers = Object.entries( additionalControllers ).reduce( ( obj, [ path, name ] ) => {

			obj[ name ] = { [ name ]: path };
			return obj;

		}, {} );

		controller = proxyquire( modulePath, {

			'../../../lib/backend-service': backend,
			'../../../lib/urls': urls,
			'../../../lib/metadata': metadata,
			'../view-models/detail': reportDetailViewModel,
			'../view-models/reports': reportsViewModel,

			...Object.entries( additionalControllers ).reduce( ( obj, [ path, name ] ) => {

				obj[ path ] = controllers[ name ];
				return obj;

			}, {} )
		} );
	} );

	describe( 'Additional controllers', () => {
		it( 'Should incude the other controllers', () => {

			Object.keys( controllers ).forEach( ( key ) => {
				expect( controller[ key ] ).toEqual( controllers[ key ] );
			} );
		} );
	} );

	describe( 'Index', () => {
		describe( 'Without an error', () => {
			describe( 'With a success response', () => {
				describe( 'When the user has a country', () => {
					it( 'Should get the reports and render the index page', async () => {

						const country = { id: 1, name: 'test' };
						const unfinishedReportsResponse = {
							response: { isSuccess: true  },
							body: {
								results: [ { id: 1 } ]
							}
						};
						const reportsViewModelResponse = { reports: true };

						req.user.country = country;

						reportsViewModel.and.callFake( () => reportsViewModelResponse );
						backend.reports.getForCountry.and.callFake( () => Promise.resolve( unfinishedReportsResponse ) );

						await controller.index( req, res, next );

						expect( next ).not.toHaveBeenCalled();
						expect( backend.reports.getForCountry ).toHaveBeenCalledWith( req, country.id );
						expect( reportsViewModel ).toHaveBeenCalledWith( unfinishedReportsResponse.body.results, country );
						expect( res.render ).toHaveBeenCalledWith( 'reports/views/my-country', reportsViewModelResponse );
					} );
				} );

				describe( 'When the user does NOT have a country', () => {
					it( 'Should get the reports and render the index page', async () => {

						const unfinishedReportsResponse = {
							response: { isSuccess: true  },
							body: {
								results: [ { id: 1 } ]
							}
						};
						const reportsViewModelResponse = { reports: true };

						reportsViewModel.and.callFake( () => reportsViewModelResponse );
						backend.reports.getAll.and.callFake( () => Promise.resolve( unfinishedReportsResponse ) );

						await controller.index( req, res, next );

						expect( next ).not.toHaveBeenCalled();
						expect( backend.reports.getAll ).toHaveBeenCalledWith( req );
						expect( reportsViewModel ).toHaveBeenCalledWith( unfinishedReportsResponse.body.results, req.user.country );
						expect( res.render ).toHaveBeenCalledWith( 'reports/views/index', reportsViewModelResponse );
					} );
				} );
			} );

			describe( 'Without a success response', () => {
				it( 'Should get the reports and render the index page', async () => {

					const unfinishedReportsResponse = {
						response: { isSuccess: false  },
						body: {}
					};

					backend.reports.getAll.and.callFake( () => Promise.resolve( unfinishedReportsResponse ) );

					await controller.index( req, res, next );

					expect( next ).toHaveBeenCalledWith( new Error( `Got ${ unfinishedReportsResponse.response.statusCode } response from backend` ) );
					expect( backend.reports.getAll ).toHaveBeenCalledWith( req );
					expect( res.render ).not.toHaveBeenCalled();
				} );
			} );
		} );

		describe( 'With an error', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'issue with backend' );

				backend.reports.getAll.and.callFake( () => Promise.reject( err ) );

				await controller.index( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
			} );
		} );
	} );

	describe( 'New', () => {
		it( 'Should render the reports page', () => {

			controller.new( req, res );

			expect( res.render ).toHaveBeenCalledWith( 'reports/views/new', { tasks: metadata.reportTaskList } );
		} );
	} );

	describe( 'Report', () => {
		it( 'Should render the report detail page', () => {

			const reportDetailViewModelResponse = { a: 1, b: 2 };
			req.report = { c: 3, d: 4 };

			reportDetailViewModel.and.callFake( () => reportDetailViewModelResponse );

			controller.report( req, res );

			expect( reportDetailViewModel ).toHaveBeenCalledWith( csrfToken, req.report );
			expect( res.render ).toHaveBeenCalledWith( 'reports/views/detail', reportDetailViewModelResponse );
		} );
	} );

	describe( 'submitReport', () => {

		beforeEach( () => {

			req.report = { id: 1, b: 2 };
		} );

		describe( 'When the response is a success', () => {

			beforeEach( () => {

				backend.reports.submit.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );

				form.hasErrors = () => false;
			} );

			afterEach( () => {

				expect( next ).not.toHaveBeenCalled();
				expect( backend.reports.submit ).toHaveBeenCalledWith( req, req.report.id );
			} );

			it( 'Should render the barrier detail page', async () => {

				const detailUrlResponse = '/a-url';

				urls.barriers.detail.and.callFake( () => detailUrlResponse );

				await controller.submit( req, res, next );

				expect( req.flash ).toHaveBeenCalledWith( 'barrier-created', req.report.id );
				expect( urls.barriers.detail ).toHaveBeenCalledWith( req.report.id );
				expect( res.redirect ).toHaveBeenCalledWith( detailUrlResponse );
			} );
		} );

		describe( 'When the response is not a success', () => {
			it( 'Should redirect to the report detail page', async () => {

				const statusCode = 500;
				const reportDetailResponse = '/reportDetail';
				urls.reports.detail.and.callFake( () => reportDetailResponse );
				form.hasErrors = () => false;
				backend.reports.submit.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

				await controller.submit( req, res, next );

				expect( req.flash ).not.toHaveBeenCalled();
				expect( urls.reports.detail ).toHaveBeenCalledWith( req.report.id );
				expect( res.redirect ).toHaveBeenCalledWith( reportDetailResponse );
			} );
		} );

		describe( 'When the request fails', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'my test' );
				form.hasErrors = () => false;
				backend.reports.submit.and.callFake( () => Promise.reject( err ) );

				await controller.submit( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
			} );
		} );
	} );
} );
