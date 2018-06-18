const proxyquire = require( 'proxyquire' );
const modulePath = '../../../../app/controllers/index';

let controller;
let req;
let res;
let backend;
let ssoToken;
let next;
let dashboardViewModel;

describe( 'Index controller', () => {

	beforeEach( () => {

		ssoToken = 'abc-123';
		backend = {
			getReports: jasmine.createSpy( 'backend.getReports' )
		};
		dashboardViewModel = jasmine.createSpy( 'dashboard view model' );

		req = { session: { ssoToken } };
		res = { render: jasmine.createSpy( 'res.render' ) };
		next = jasmine.createSpy( 'next' );

		controller = proxyquire( modulePath, {
			'../lib/backend-service': backend,
			'../lib/view-models/dashboard': dashboardViewModel
		} );
	} );

	describe( 'Without an error', () => {
		describe( 'With a success response', () => {
			it( 'Should get the reports and render the index page', async () => {

				const reportResponse = {
					response: { isSuccess: true  },
					body: {
						results: [ { id: 1 } ]
					}
				};
				const dashboardViewModelResponse = { dashboard: true };

				dashboardViewModel.and.callFake( () => dashboardViewModelResponse );
				backend.getReports.and.callFake( () => Promise.resolve( reportResponse ) );

				await controller( req, res, next );

				expect( next ).not.toHaveBeenCalled();
				expect( backend.getReports ).toHaveBeenCalledWith( req );
				expect( dashboardViewModel ).toHaveBeenCalledWith( reportResponse.body.results );
				expect( res.render ).toHaveBeenCalledWith( 'index', dashboardViewModelResponse );
			} );
		} );

		describe( 'Without a success response', () => {
			it( 'Should get the reports and render the index page', async () => {

				const reportResponse = {
					response: { isSuccess: false  },
					body: {}
				};

				backend.getReports.and.callFake( () => Promise.resolve( reportResponse ) );

				await controller( req, res, next );

				expect( next ).toHaveBeenCalledWith( new Error( `Got ${ reportResponse.response.statusCode } response from backend` ) );
				expect( backend.getReports ).toHaveBeenCalledWith( req );
				expect( res.render ).not.toHaveBeenCalled();
			} );
		} );
	} );

	describe( 'With an error', () => {
		it( 'Should call next with the error', async () => {

			const err = new Error( 'issue with backend' );

			backend.getReports.and.callFake( () => Promise.reject( err ) );

			await controller( req, res, next );

			expect( next ).toHaveBeenCalledWith( err );
		} );
	} );
} );
