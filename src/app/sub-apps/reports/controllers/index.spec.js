const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

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
				submit: jasmine.createSpy( 'backend.reports.submit' ),
				delete: jasmine.createSpy( 'backend.reports.delete' )
			}
		};

		urls = {
			reports: {
				detail: jasmine.createSpy( 'urls.reports.detail' ),
				index: jasmine.createSpy( 'urls.reports.index' ),
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
			'./all-sectors': 'allSectors',
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
						const reportsViewModelResponse = {
							reports: true,
							currentReport: undefined,
						};

						req.user.country = country;

						reportsViewModel.and.callFake( () => reportsViewModelResponse );
						backend.reports.getAll.and.callFake( () => Promise.resolve( unfinishedReportsResponse ) );

						await controller.index( req, res, next );

						expect( next ).not.toHaveBeenCalled();
						expect( backend.reports.getAll ).toHaveBeenCalledWith( req );
						expect( reportsViewModel ).toHaveBeenCalledWith( unfinishedReportsResponse.body.results, undefined );
						expect( res.render ).toHaveBeenCalledWith(
							'reports/views/index',
							Object.assign( {},
								reportsViewModelResponse,
								{ csrfToken, isDelete: false }
							)
						);
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
						const reportsViewModelResponse = {
							reports: true,
							currentReport: undefined
						};

						reportsViewModel.and.callFake( () => reportsViewModelResponse );
						backend.reports.getAll.and.callFake( () => Promise.resolve( unfinishedReportsResponse ) );

						await controller.index( req, res, next );

						expect( next ).not.toHaveBeenCalled();
						expect( backend.reports.getAll ).toHaveBeenCalledWith( req );
						expect( reportsViewModel ).toHaveBeenCalledWith( unfinishedReportsResponse.body.results, undefined );
						expect( res.render ).toHaveBeenCalledWith(
							'reports/views/index',
							Object.assign( {},
								reportsViewModelResponse,
								{ csrfToken, isDelete: false }
							)
						);
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

	describe( 'Delete', () => {

		beforeEach( () => {
			req.params = { reportId: '1234' };
		} );

		describe( 'When the request is a GET', () => {
			describe( 'Without an error', () => {
				describe( 'With a success response', () => {
					describe( 'When it is an XHR request', () => {
						it( 'Should render the modal and return it', async () => {

							const reportId = uuid();
							const viewModelResponse = [ { test: 2 } ];

							req.xhr = true;
							req.report = {
								id: reportId,
								test: 1
							};

							reportsViewModel.and.callFake( () => ({ reports: viewModelResponse }) );

							await controller.delete( req, res, next );

							expect( reportsViewModel ).toHaveBeenCalledWith( [ req.report ] );
							expect( res.render ).toHaveBeenCalledWith( 'reports/views/partials/delete-report-modal', { report: viewModelResponse[ 0 ], csrfToken } );
						} );
					} );
					describe( 'When the user has a country', () => {
						it( 'Should get the reports and render the index page', async () => {

							const country = { id: 1, name: 'test' };
							const unfinishedReportsResponse = {
								response: { isSuccess: true  },
								body: {
									results: [ { id: 1 } ]
								}
							};
							const reportsViewModelResponse = {
								reports: true,
								currentReport: '1234'
							};

							req.user.country = country;

							reportsViewModel.and.callFake( () => reportsViewModelResponse );
							backend.reports.getAll.and.callFake( () => Promise.resolve( unfinishedReportsResponse ) );

							await controller.delete( req, res, next );

							expect( next ).not.toHaveBeenCalled();
							expect( backend.reports.getAll ).toHaveBeenCalledWith( req );
							expect( reportsViewModel ).toHaveBeenCalledWith( unfinishedReportsResponse.body.results, '1234' );
							expect( res.render ).toHaveBeenCalledWith( 'reports/views/index', {
								...reportsViewModelResponse,
								csrfToken,
								isDelete: true,
							} );
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
							const reportsViewModelResponse = {
								reports: true,
								currentReport: '1234'
							};

							reportsViewModel.and.callFake( () => reportsViewModelResponse );
							backend.reports.getAll.and.callFake( () => Promise.resolve( unfinishedReportsResponse ) );

							await controller.delete( req, res, next );

							expect( next ).not.toHaveBeenCalled();
							expect( backend.reports.getAll ).toHaveBeenCalledWith( req );
							expect( reportsViewModel ).toHaveBeenCalledWith( unfinishedReportsResponse.body.results, '1234' );
							expect( res.render ).toHaveBeenCalledWith( 'reports/views/index', {
								...reportsViewModelResponse,
								csrfToken,
								isDelete: true
							} );
						} );
					} );
				} );

				describe( 'Without a success response', () => {
					it( 'Should call next with an error', async () => {

						const unfinishedReportsResponse = {
							response: { isSuccess: false  },
							body: {}
						};

						const reportsViewModelResponse = { reports: [] };

						reportsViewModel.and.callFake( () => reportsViewModelResponse );

						backend.reports.getAll.and.callFake( () => Promise.resolve( unfinishedReportsResponse ) );

						await controller.delete( req, res, next );

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

					await controller.delete( req, res, next );

					expect( next ).toHaveBeenCalledWith( err );
				} );
			} );
		});

		describe(' When the request is a POST', () => {

			beforeEach( () => {
				req.method = 'POST';
			} );

			describe( 'When the current user does not match the created by user', () => {
				it( 'Should call next with an error', async () => {

					req.report = { id: 1, created_by: { id: 2 } };
					req.user = { id: 3 };

					await controller.delete( req, res, next );

					expect( backend.reports.delete ).not.toHaveBeenCalled();
					expect( res.render ).not.toHaveBeenCalled();
					expect( next ).toHaveBeenCalledWith( new Error( 'Cannot delete a note that is not created by the current user' ) );
				} );
			} );

			describe( 'When the current user matches the created by user', () => {

				beforeEach( () => {

					req.report = { id: 4, created_by: { id: 5 } };
					req.user = { id: 5 };
				} );

				describe( 'When the service throws an error', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'boom' );
						backend.reports.delete.and.callFake( () => { throw err; } );

						await controller.delete( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
						expect( res.render ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'When the service response is not a success', () => {
					it( 'Should call next with an error', async () => {

						const statusCode = 500;
						const err = new Error( `Got ${ statusCode } response from backend` );

						backend.reports.delete.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

						await controller.delete( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
						expect( res.render ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'When the service response is success', () => {
					it( 'Should delete the report and redirect to the index page', async () => {

						backend.reports.delete.and.callFake( () => ({ response: { isSuccess: true } }) );

						const indexResponse = '/reports';
						urls.reports.index.and.callFake( () => indexResponse );

						await controller.delete( req, res, next );

						expect( res.render ).not.toHaveBeenCalled();
						expect( res.redirect ).toHaveBeenCalledWith( indexResponse );
						expect( urls.reports.index ).toHaveBeenCalled();
					} );
				} );
			} );
		});
	});

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
