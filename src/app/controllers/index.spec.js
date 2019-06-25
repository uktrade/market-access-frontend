const proxyquire = require( 'proxyquire' );
const modulePath = './index';

let controller;
let req;
let res;
let next;
let csrfToken;
let backend;
let ssoToken;
let dashboardViewModel;
let watchList;
let urls;
let metadata;

const OPEN = '100';
const HIBERNATED = '101';

describe( 'Index controller', () => {

	beforeEach( () => {

		ssoToken = 'abc-123';
		watchList = {
			transformFilterValue: jasmine.createSpy( 'watchList.transformFilterValue' )
		};

		backend = {
			barriers: {
				getAll: jasmine.createSpy( 'backend.barriers.getAll' ),
			},
			documents: {
				download: jasmine.createSpy( 'backend.documents.download' ),
				getScanStatus: jasmine.createSpy( 'backend.documents.getScanStatus' ),
				delete: jasmine.createSpy( 'backend.documents.delete' ),
			}
		};
		dashboardViewModel = jasmine.createSpy( 'dashboard view model' );

		urls = {
			me: jasmine.createSpy( 'urls.me' )
		};

		metadata = {
			barrier: {
				status: {
					types: {
						OPEN,
						HIBERNATED
					}
				}
			}
		};

		( { req, res, next, csrfToken } = jasmine.helpers.mocks.middleware() );

		req.session = { ssoToken };

		controller = proxyquire( modulePath, {
			'../lib/backend-service': backend,
			'../lib/urls': urls,
			'../view-models/dashboard': dashboardViewModel,
			'../lib/metadata': metadata,
			'./watch-list': watchList
		} );
	} );

	describe( 'Index', () => {

		const sortData = {
			fields: [ 'priority', 'date', 'location', 'status', 'updated' ],
			directions: [ 'asc', 'desc' ],
			serviceParamMap: {
				date: 'reported_on',
				location: 'export_country',
				updated: 'modified_on',
			},
		};
		const defaultCurrentSort = {
			field: 'updated',
			serviceParam: 'modified_on',
			direction: 'desc',
		};

		describe( 'When there is a watch list', () => {

			beforeEach(() => {
				req.user.user_profile = {
					watchList: {
						name: 'hello1',
						filters: {
							country: '1234'
						}
					}
				};
				watchList.transformFilterValue.and.callFake( () => 'Country 1' );
			});

			describe( 'Without an error', () => {
				describe( 'With a success response', () => {
					let barriersResponse;
					let dashboardViewModelResponse;

					beforeEach( () => {

						barriersResponse = {
							response: { isSuccess: true  },
							body: {
								results: [ { id: 1 } ]
							}
						};
						dashboardViewModelResponse = { dashboard: true };

						dashboardViewModel.and.callFake( () => dashboardViewModelResponse );
						backend.barriers.getAll.and.callFake( () => Promise.resolve( barriersResponse ) );
					} );

					afterEach( () => {

						expect( next ).not.toHaveBeenCalled();
						expect( res.render ).toHaveBeenCalledWith( 'index', dashboardViewModelResponse );
					} );

					describe( 'When there is not any sorting', () => {
						it( 'Should get all the reports with a default sort and render the correct template', async () => {

							await controller.index( req, res, next );

							expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, { country: '1234' }, 'modified_on', 'desc' );
							expect( dashboardViewModel ).toHaveBeenCalledWith(
								barriersResponse.body.results,
								{ ...sortData, currentSort: defaultCurrentSort},
								true,
								[{key: 'country', value: 'Country 1' }],
								{ country: '1234'},
							);
						} );
					} );

					describe( 'When there is sorting', () => {
						describe( 'Sorting by priority', () => {

							beforeEach( () => {
								req.query = {
									sortBy: 'priority',
								};
							} );

							describe( 'With no direction specified', () => {
								it( 'Should get the report sorted correctly and render the correct template', async () => {

									await controller.index( req, res, next );

									expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, { country: '1234' }, 'priority', 'desc' );
									expect( dashboardViewModel ).toHaveBeenCalledWith(
										barriersResponse.body.results,
										{ ...sortData, currentSort: { field: 'priority', serviceParam: 'priority', direction: 'desc', }},
										true,
										[{key: 'country', value: 'Country 1' }],
										{ country: '1234'},
									);
								} );
							} );

							describe( 'With asc direction specified', () => {
								it( 'Should get the report sorted correctly and render the correct template', async () => {

									req.query.sortDirection = 'asc';

									await controller.index( req, res, next );

									expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, { country: '1234' }, 'priority', 'asc' );
									expect( dashboardViewModel ).toHaveBeenCalledWith(
										barriersResponse.body.results,
										{ ...sortData, currentSort: { field: 'priority', serviceParam: 'priority', direction: 'asc', }},
										true,
										[{key: 'country', value: 'Country 1' }],
										{ country: '1234'},
									);
								} );
							} );

							describe( 'With desc direction specified', () => {
								it( 'Should get the report sorted correctly and render the correct template', async () => {

									req.query.sortDirection = 'desc';

									await controller.index( req, res, next );

									expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, { country: '1234' }, 'priority', 'desc' );
									expect( dashboardViewModel ).toHaveBeenCalledWith(
										barriersResponse.body.results,
										{ ...sortData, currentSort: { field: 'priority', serviceParam: 'priority', direction: 'desc', }},
										true,
										[{key: 'country', value: 'Country 1' }],
										{ country: '1234'},
									);
								} );
							} );

							describe( 'With an unknown direction specified', () => {
								it( 'Should get the report sorted correctly and render the correct template', async () => {

									req.query.sortDirection = 'descabc';

									await controller.index( req, res, next );

									expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, { country: '1234' }, 'priority', 'desc' );
									expect( dashboardViewModel ).toHaveBeenCalledWith(
										barriersResponse.body.results,
										{ ...sortData, currentSort: { field: 'priority', serviceParam: 'priority', direction: 'desc', }},
										true,
										[{key: 'country', value: 'Country 1' }],
										{ country: '1234'},
									);
								} );
							} );
						} );
					} );
				} );

				describe( 'Without a success response', () => {
					it( 'Should get the reports and render the index page', async () => {

						const barriersResponse = {
							response: { isSuccess: false  },
							body: {}
						};

						backend.barriers.getAll.and.callFake( () => Promise.resolve( barriersResponse ) );

						await controller.index( req, res, next );

						expect( next ).toHaveBeenCalledWith( new Error( `Got ${ barriersResponse.response.statusCode } response from backend` ) );
						expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, { country: '1234' }, 'modified_on', 'desc' );
						expect( res.render ).not.toHaveBeenCalled();
					} );
				} );
			} );
			describe( 'With an error', () => {
				it( 'Should call next with the error', async () => {

					const err = new Error( 'issue with backend' );

					backend.barriers.getAll.and.callFake( () => Promise.reject( err ) );

					await controller.index( req, res, next );

					expect( next ).toHaveBeenCalledWith( err );
				} );
			} );
		});
		describe( 'When there is not a watch list', () => {
		});
	} );

	describe( 'me', () => {
		describe( 'a GET', () => {
			it( 'Should render the me page', () => {

				controller.me( req, res );

				expect( res.render ).toHaveBeenCalledWith( 'me', { csrfToken } );
			} );
		} );

		describe( 'A POST', () => {
			it( 'Should delete the session user and redirect to the me page', () => {

				const meResponse = '/me-response';

				urls.me.and.callFake( () => meResponse );
				req.method = 'POST';

				controller.me( req, res );

				expect( req.session.user ).not.toBeDefined();
				expect( res.render ).not.toHaveBeenCalled();
				expect( res.redirect ).toHaveBeenCalledWith( meResponse );
			} );
		} );
	} );

	describe( 'Documents', () => {
		describe( 'download', () => {

			const errorMessage = 'Unable to get document download link';

			describe( 'When the backend call throws an error', () => {
				it( 'Should call next with the error', async () => {

					const err = new Error( 'fail' );
					backend.documents.download.and.callFake( () => Promise.reject( err ) );

					await controller.documents.download( req, res, next );

					expect( next ).toHaveBeenCalledWith( err );
				} );
			} );

			describe( 'When the backend returns a response', () => {
				describe( 'When it is a success', () => {
					describe( 'When there is a document_url', () => {
						it( 'Should redirect to the url', async () => {

							const url = '/a/b/c/';

							backend.documents.download.and.callFake( () => Promise.resolve( {
								response: { isSuccess: true },
								body: { document_url: url },
							} ) );

							await controller.documents.download( req, res, next );

							expect( res.redirect ).toHaveBeenCalledWith( url );
							expect( next ).not.toHaveBeenCalled();
						} );
					} );

					describe( 'When there is NOT a document_url', () => {
						it( 'Should call next with an error', async () => {

							backend.documents.download.and.callFake( () => Promise.resolve( {
								response: { isSuccess: true },
								body: {},
							} ) );

							await controller.documents.download( req, res, next );

							expect( res.redirect ).not.toHaveBeenCalled();
							expect( next ).toHaveBeenCalledWith( new Error( errorMessage ));
						} );
					} );
				} );

				describe( 'When it is NOT a success', () => {
					it( 'Should call next with an error', async () => {

						backend.documents.download.and.callFake( () => Promise.resolve( {
							response: { isSuccess: false },
							body: {},
						} ) );

						await controller.documents.download( req, res, next );

						expect( res.redirect ).not.toHaveBeenCalled();
						expect( next ).toHaveBeenCalledWith( new Error( errorMessage ));
					} );
				} );
			} );
		} );
	} );
} );
