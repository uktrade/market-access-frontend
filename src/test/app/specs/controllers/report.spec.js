const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

const modulePath = '../../../../app/controllers/report';

describe( 'Report controller', () => {

	let controller;
	let req;
	let res;
	let datahub;
	let urls;
	let startFormViewModel;
	let csrfToken;

	beforeEach( () => {

		csrfToken = uuid();

		req = {
			query: {},
			csrfToken: () => csrfToken
		};
		res = {
			render: jasmine.createSpy( 'res.render' ),
			redirect: jasmine.createSpy( 'res.redirect' )
		};
		datahub = {
			searchCompany: jasmine.createSpy( 'datahub.searchCompany' )
		};
		urls = {
			report: {
				company: jasmine.createSpy( 'urls.report.company' )
			}
		};
		startFormViewModel = jasmine.createSpy( 'startFormViewModel' );

		controller = proxyquire( modulePath, {
			'../lib/datahub-service': datahub,
			'../lib/urls': urls,
			'../lib/view-models/report/start-form': startFormViewModel
		} );
	} );

	describe( 'Index', () => {

		it( 'Should render the report page', () => {

			controller.index( req, res );

			expect( res.render ).toHaveBeenCalledWith( 'report/index' );
		} );
	} );

	describe( 'Start', () => {

		let ssoToken;

		beforeEach( () => {

			ssoToken = uuid();
			req.session = { ssoToken };
		} );

		describe( 'When it is a POST', () => {

			describe( 'When the input values are valid', () => {

				it( 'Should save the values and redirect to the next step', () => {

					const companyUrl = 'my-url';
					const status = '123';
					const emergency = '456';

					req.method = 'POST';
					req.body = { status, emergency };

					urls.report.company.and.callFake( () => companyUrl );

					controller.start( req, res );

					expect( req.session.startFormValues ).toEqual( { status, emergency } );
					expect( res.redirect ).toHaveBeenCalledWith( companyUrl );
				} );
			} );
		} );

		describe( 'When it is a GET', () => {

			it( 'Should get the status types and render the start page', () => {

				const sessionValues = { status: 1, emergency: 2 };
				const startFormViewModelResponse = { status1: true, status2: true };

				startFormViewModel.and.callFake( () => startFormViewModelResponse );
				req.session.startFormValues = sessionValues;

				controller.start( req, res );

				expect( startFormViewModel ).toHaveBeenCalledWith( csrfToken, sessionValues );
				expect( res.render ).toHaveBeenCalledWith( 'report/start', startFormViewModelResponse );
			} );
		} );

	} );

	describe( 'Company details', () => {

		it( 'Should render the details page', () => {

			const companyId = 1234;

			req.params = { companyId };

			controller.companyDetails( req, res );

			expect( res.render ).toHaveBeenCalledWith( 'report/company-details', { csrfToken, companyId } );
		} );
	} );

	describe( 'Company Search', () => {

		let next;
		const template = 'report/company-search';

		beforeEach( () => {

			next = jasmine.createSpy( 'next' );
		} );

		describe( 'Without a query', () => {

			it( 'Should render the search page', () => {

				controller.companySearch( req, res, next );

				expect( res.render ).toHaveBeenCalledWith( template, {} );
				expect( next ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'With a query', () => {

			const query = 'a search term';

			beforeEach( () => {

				req.query.q = query;
			} );

			describe( 'When there is not an error', () => {

				describe( 'When a company is found', () => {

					it( 'Should render the results', ( done ) => {

						const body = {	some: 'data' };

						const promise = new Promise( ( resolve ) => {

							resolve( { response: { isSuccess: true }, body } );
						} );

						datahub.searchCompany.and.callFake( () => promise );

						controller.companySearch( req, res, next );

						promise.then( () => {

							expect( res.render ).toHaveBeenCalledWith( template, { query, results: body } );
							done();
						} );
					} );
				} );

				describe( 'When a company is not found', () => {

					it( 'Should render an error message', ( done ) => {

						const promise = new Promise( ( resolve ) => {

							resolve( { response: { isSuccess: false, statusCode: 404 } } );
						} );

						datahub.searchCompany.and.callFake( () => promise );

						controller.companySearch( req, res, next );

						promise.then( () => {

							expect( res.render ).toHaveBeenCalledWith( template, { query, error: 'No company found' } );
							done();
						} );
					} );
				} );

				describe( 'When there is an error with the request', () => {

					it( 'Should render an error message', ( done ) => {

						const promise = new Promise( ( resolve ) => {

							resolve( { response: { isSuccess: false, statusCode: 400 } } );
						} );

						datahub.searchCompany.and.callFake( () => promise );

						controller.companySearch( req, res, next );

						promise.then( () => {

							expect( res.render ).toHaveBeenCalledWith( template, { query, error: 'There was an error finding the company' } );
							done();
						} );
					} );
				} );
			} );

			describe( 'When there is an error', () => {

				it( 'Should pass the error on', ( done ) => {

					const err = new Error( 'some error state' );

					const promise = new Promise( ( resolve, reject ) => {

						reject( err );
					} );

					datahub.searchCompany.and.callFake( () => promise );

					controller.companySearch( req, res, next );

					process.nextTick( () => {

						expect( next ).toHaveBeenCalledWith( err );
						done();
					} );
				} );
			} );
		} );
	} );
} );
