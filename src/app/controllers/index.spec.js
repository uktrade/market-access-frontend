const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid' );
const modulePath = './index';

let controller;
let req;
let res;
let next;
let backend;
let ssoToken;
let dashboardViewModel;
let urls;

describe( 'Index controller', () => {

	beforeEach( () => {

		ssoToken = 'abc-123';
		backend = {
			barriers: {
				getAll: jasmine.createSpy( 'backend.barriers.getAll' ),
			},
			documents: {
				download: jasmine.createSpy( 'backend.documents.download' )
			}
		};
		dashboardViewModel = jasmine.createSpy( 'dashboard view model' );

		urls = {
			me: jasmine.createSpy( 'urls.me' )
		};

		req = {
			session: { ssoToken },
			user: {},
			params: {},
			csrfToken: jasmine.createSpy( 'csrfToken' )
		};

		res = {
			render: jasmine.createSpy( 'res.render' ),
			redirect: jasmine.createSpy( 'res.redirect' )
		};

		next = jasmine.createSpy( 'next' );

		controller = proxyquire( modulePath, {
			'../lib/backend-service': backend,
			'../lib/urls': urls,
			'../view-models/dashboard': dashboardViewModel,
		} );
	} );

	describe( 'Index', () => {
		describe( 'Without an error', () => {
			describe( 'With a success response', () => {
				describe( 'When the user has a country', () => {
					it( 'Should get the country reports and render the correct template', async () => {

						const country = { id: 2, name: 'test' };
						const barriersResponse = {
							response: { isSuccess: true  },
							body: {
								results: [ { id: 1 } ]
							}
						};
						const dashboardViewModelResponse = { dashboard: true };

						req.user.country = country;

						dashboardViewModel.and.callFake( () => dashboardViewModelResponse );
						backend.barriers.getAll.and.callFake( () => Promise.resolve( barriersResponse ) );

						await controller.index( req, res, next );

						expect( next ).not.toHaveBeenCalled();
						expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, { country: country.id } );
						expect( dashboardViewModel ).toHaveBeenCalledWith( barriersResponse.body.results, country );
						expect( res.render ).toHaveBeenCalledWith( 'my-country', dashboardViewModelResponse );
					} );
				} );

				describe( 'When the user does NOT have a country', () => {
					it( 'Should get all the reports and render the correct template', async () => {

						const barriersResponse = {
							response: { isSuccess: true  },
							body: {
								results: [ { id: 1 } ]
							}
						};
						const dashboardViewModelResponse = { dashboard: true };

						dashboardViewModel.and.callFake( () => dashboardViewModelResponse );
						backend.barriers.getAll.and.callFake( () => Promise.resolve( barriersResponse ) );

						await controller.index( req, res, next );

						expect( next ).not.toHaveBeenCalled();
						expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, {} );
						expect( dashboardViewModel ).toHaveBeenCalledWith( barriersResponse.body.results, req.user.country );
						expect( res.render ).toHaveBeenCalledWith( 'index', dashboardViewModelResponse );
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
					expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, {} );
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
	} );

	describe( 'me', () => {
		describe( 'a GET', () => {
			it( 'Should render the me page', () => {

				const token = uuid();

				req.csrfToken.and.callFake( () => token );

				controller.me( req, res );

				expect( res.render ).toHaveBeenCalledWith( 'me', { csrfToken: token } );
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

	describe( 'download', () => {

		const errorMessage = 'Unable to get document download link';

		describe( 'When the backend call throws an error', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'fail' );
				backend.documents.download.and.callFake( () => Promise.reject( err ) );

				await controller.download( req, res, next );

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

						await controller.download( req, res, next );

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

						await controller.download( req, res, next );

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

					await controller.download( req, res, next );

					expect( res.redirect ).not.toHaveBeenCalled();
					expect( next ).toHaveBeenCalledWith( new Error( errorMessage ));
				} );
			} );
		} );
	} );
} );
