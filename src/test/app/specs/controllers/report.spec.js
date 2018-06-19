const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

const modulePath = '../../../../app/controllers/report';

describe( 'Report controller', () => {

	let controller;
	let req;
	let res;
	let datahub;
	let backend;
	let urls;
	let startFormViewModel;
	let csrfToken;
	let aboutProblemViewModel;

	beforeEach( () => {

		csrfToken = uuid();

		req = {
			query: {},
			csrfToken: () => csrfToken,
			session: {},
			params: {},
			error: jasmine.createSpy( 'req.error' )
		};
		res = {
			render: jasmine.createSpy( 'res.render' ),
			redirect: jasmine.createSpy( 'res.redirect' )
		};
		backend = {
			saveNewReport: jasmine.createSpy( 'backend.saveNewReport' ),
			updateReport: jasmine.createSpy( 'backend.updateReport' )
		};
		datahub = {
			searchCompany: jasmine.createSpy( 'datahub.searchCompany' )
		};
		urls = {
			index: jasmine.createSpy( 'urls.index' ),
			report: {
				companySearch: jasmine.createSpy( 'urls.report.companySearch' ),
				companyDetails: jasmine.createSpy( 'urls.report.companyDetails' ),
				contacts: jasmine.createSpy( 'urls.report.contacts' ),
				aboutProblem: jasmine.createSpy( 'urls.report.aboutProblem' )
			}
		};
		startFormViewModel = jasmine.createSpy( 'startFormViewModel' );
		aboutProblemViewModel = jasmine.createSpy( 'aboutProblemViewModel' );

		controller = proxyquire( modulePath, {
			'../lib/backend-service': backend,
			'../lib/datahub-service': datahub,
			'../lib/urls': urls,
			'../lib/view-models/report/start-form': startFormViewModel,
			'../lib/view-models/report/about-problem': aboutProblemViewModel
		} );
	} );

	function checkFormError( ...errors ){

		const calls = req.error.calls;
		let i = 0;
		let err;
		let args;

		expect( calls.count() ).toEqual( errors.length );

		while( ( err = errors[ i ] ) ){

			args = calls.argsFor( i );

			expect( args[ 0 ] ).toEqual( err );
			expect( args[ 1 ].length ).toBeGreaterThan( 0 );

			i++;
		}
	}

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

			beforeEach( () => {

				req.method = 'POST';
				req.body = {};
			} );

			describe( 'When the input values are valid', () => {

				it( 'Should save the values and redirect to the next step', () => {

					const companyUrl = 'my-url';
					const status = '123';
					const emergency = '456';

					req.body = { status, emergency };

					urls.report.companySearch.and.callFake( () => companyUrl );

					controller.start( req, res );

					expect( req.session.startFormValues ).toEqual( { status, emergency } );
					expect( res.redirect ).toHaveBeenCalledWith( companyUrl );
				} );
			} );

			describe( 'When no input values are given', () => {

				beforeEach( () => {

					req.session.startFormValues = { test: 1 };
				} );

				function checkStartError( ...errors ){

					checkFormError( ...errors );

					expect( req.session.startFormValues ).not.toBeDefined();
				}

				it( 'Should add an error', () => {

					controller.start( req, res );
					checkStartError( 'status' );
				} );

				describe( 'When no emergency is given', () => {

					describe( 'When the status is 1', () => {
						it( 'Should add an error', () => {

							req.body.status = '1';
							controller.start( req, res );
							checkStartError( 'emergency' );
						} );
					} );

					describe( 'When the status is 2', () => {
						it( 'Should add an error', () => {

							req.body.status = '2';
							controller.start( req, res );
							checkStartError( 'emergency' );
						} );
					} );
				} );
			} );

		} );

		describe( 'When it is a GET', () => {
			it( 'Should get the status types and render the start page', () => {

				let status, emergency;
				const sessionValues = { status: 1, emergency: 2 };
				const startFormViewModelResponse = { status1: true, status2: true };
				const formValues = { status, emergency };

				startFormViewModel.and.callFake( () => startFormViewModelResponse );
				req.session.startFormValues = sessionValues;

				controller.start( req, res );

				expect( startFormViewModel ).toHaveBeenCalledWith( csrfToken, formValues, sessionValues );
				expect( res.render ).toHaveBeenCalledWith( 'report/start', startFormViewModelResponse );
			} );
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

				req.query.company = query;
			} );

			describe( 'When there is not an error', () => {
				describe( 'When a company is found', () => {
					it( 'Should render the results', async () => {

						const body = {	some: 'data' };

						const promise = Promise.resolve( { response: { isSuccess: true }, body } );

						datahub.searchCompany.and.callFake( () => promise );

						await controller.companySearch( req, res, next );

						expect( res.render ).toHaveBeenCalledWith( template, { query, results: body } );
					} );
				} );

				describe( 'When a company is not found', () => {
					it( 'Should render an error message', async () => {

						const promise = Promise.resolve( { response: { isSuccess: false, statusCode: 404 } } );

						datahub.searchCompany.and.callFake( () => promise );

						await controller.companySearch( req, res, next );

						expect( res.render ).toHaveBeenCalledWith( template, { query, error: 'No company found' } );
					} );
				} );

				describe( 'When there is an error with the request', () => {
					it( 'Should render an error message', async () => {

						const promise = Promise.resolve( { response: { isSuccess: false, statusCode: 400 } } );

						datahub.searchCompany.and.callFake( () => promise );

						await controller.companySearch( req, res, next );

						expect( res.render ).toHaveBeenCalledWith( template, { query, error: 'There was an error finding the company' } );
					} );
				} );
			} );

			describe( 'When there is an error', () => {
				it( 'Should pass the error on', async () => {

					const err = new Error( 'some error state' );

					const promise = Promise.reject( err );

					datahub.searchCompany.and.callFake( () => promise );

					await controller.companySearch( req, res, next );

					expect( next ).toHaveBeenCalledWith( err );
				} );
			} );
		} );

		describe( 'When the query is empty', () => {
			it( 'Should add an error', () => {

				req.error = jasmine.createSpy( 'req.error' );
				req.query.company = '';

				controller.companySearch( req, res, next );

				checkFormError( 'company' );
			} );
		} );
	} );

	describe( 'Company details', () => {
		describe( 'When it is a POST', () => {
			describe( 'When the companyId and sessionCompany id match', () => {
				it( 'Should redirect to the contacts page', () => {

					const companyId = 'abc';
					const reportId = '1';
					const contactResponse = '/a-link/';

					req.method = 'POST';
					req.body = { companyId };
					req.session.reportCompany = { id: companyId };
					req.params.reportId = reportId;

					urls.report.contacts.and.callFake( () => contactResponse );

					controller.companyDetails( req, res );

					expect( res.redirect ).toHaveBeenCalledWith( contactResponse );
					expect( urls.report.contacts ).toHaveBeenCalledWith( companyId, reportId );
				} );
			} );

			describe( 'When the ids do not match', () => {
				it( 'Should redirect to the company search page', () => {

					const reportId = '2';
					const searchResponse = '/another-link/';

					req.method = 'POST';
					req.body = { companyId: '123' };
					req.params.reportId = reportId;
					req.session.reportCompany = { id: '123-456' };

					urls.report.companySearch.and.callFake( () => searchResponse );

					controller.companyDetails( req, res );

					expect( res.redirect ).toHaveBeenCalledWith( searchResponse );
					expect( urls.report.companySearch ).toHaveBeenCalledWith( reportId );
				} );
			} );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should save the company name and id in the session and render the details page', () => {

				const company = {
					id: 'abc-123',
					name: 'a company name',
					something: 'else',
					another: 'thing'
				};

				req.company = company;
				controller.companyDetails( req, res );

				expect( req.session.reportCompany ).toEqual( { id: company.id, name: company.name } );
				expect( res.render ).toHaveBeenCalledWith( 'report/company-details', { csrfToken } );
			} );
		} );
	} );

	describe( 'Save', () => {

		let next;

		beforeEach( () => {

			next = jasmine.createSpy( 'next' );
			req.body = {};
		} );

		describe( 'When there is not a contact in the session', () => {
			it( 'Should redirect to the contacts page', async () => {

				const contactsResponse = '/contacts';
				const sessionCompany = { id: '123-456' };

				req.session.reportCompany = sessionCompany;

				urls.report.contacts.and.callFake( () => contactsResponse );

				await controller.save( req, res, next );

				expect( res.redirect ).toHaveBeenCalledWith( contactsResponse );
				expect( urls.report.contacts ).toHaveBeenCalledWith( sessionCompany.id );
			} );
		} );

		describe( 'When the body contactId and session contactId do not match', () => {
			it( 'Should call next with an error', async () => {

				req.body.contactId = '123-456';
				req.session.reportContact = '789';
				req.session.reportCompany = { id: 1 };

				await controller.save( req, res, next );

				expect( next ).toHaveBeenCalledWith( new Error( "Contact id doesn't match session" ) );
			} );
		} );

		describe( 'When the contactIds match', () => {

			let contactId;

			beforeEach( () => {

				contactId = 'abc-123';
				req.body.contactId = contactId;
				req.session.reportContact = contactId;
				req.session.reportCompany = { id: 1 };
			} );

			describe( 'When there is NOT a reportId', () => {
				describe( 'When there is an error thrown', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'tester' );

						backend.saveNewReport.and.callFake( () => Promise.reject( err ) );

						await controller.save( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
					} );
				} );

				describe( 'When there is not an error', () => {
					describe( 'When the response is a success', () => {
						describe( 'When there is not an id in the body', () => {
							it( 'Should call next with an error', async () => {

								backend.saveNewReport.and.callFake( () => Promise.resolve( {
									response: { isSuccess: true },
									body: {}
								} ) );

								await controller.save( req, res, next );

								expect( next ).toHaveBeenCalledWith( new Error( 'No id created for report' ) );
							} );
						} );

						describe( 'When there is an id in the body', () => {
							it( 'Should put the body in the session and redirect', async () => {

								const responseBody = { id: 1, name: 2 };
								const aboutProblemUrl = '/a-test';

								urls.report.aboutProblem.and.callFake( () => aboutProblemUrl );
								backend.saveNewReport.and.callFake( () => Promise.resolve( {
									response: { isSuccess: true },
									body: responseBody
								} ) );

								await controller.save( req, res, next );

								expect( req.session.report ).toEqual( responseBody );
								expect( res.redirect ).toHaveBeenCalledWith( aboutProblemUrl );
								expect( urls.report.aboutProblem ).toHaveBeenCalledWith( responseBody.id );
							} );
						} );
					} );

					describe( 'When the response is not a success', () => {
						it( 'Should call next with an error', async () => {

							const statusCode = 500;

							backend.saveNewReport.and.callFake( () => Promise.resolve( {
								response: { isSuccess: false, statusCode }
							} ) );

							await controller.save( req, res, next );

							const message = `Unable to save report, got ${ statusCode } response code`;
							expect( next ).toHaveBeenCalledWith( new Error( message ) );
						} );
					} );
				} );
			} );

			describe( 'When there is a reportId', () => {

				let reportId;

				beforeEach( () => {

					reportId = '3';
					req.params.reportId = reportId;
				} );

				describe( 'When the response is a success', () => {
					it( 'Should call the update method', async () => {

						req.session.reportCompany = null;
						req.report = {
							status: 1,
							is_emergency: 2,
							company_id: 3,
							company_name: 'fred'
						};

						await controller.save( req, res, next );

						expect( backend.updateReport ).toHaveBeenCalled();

						const args = backend.updateReport.calls.argsFor( 0 );
						expect( args[ 0 ] ).toEqual( req );
						expect( args[ 1 ] ).toEqual( reportId );
						expect( args[ 2 ] ).toEqual( { status: req.report.status, emergency: req.report.is_emergency } );
						expect( args[ 3 ] ).toEqual( { id: req.report.company_id, name: req.report.company_name } );
						expect( args[ 4 ] ).toEqual( contactId );
					} );
				} );

				describe( 'When the response is not a success', () => {
					it( 'Should call next with an error', async () => {

						const statusCode = 500;

						backend.updateReport.and.callFake( () => Promise.resolve( {
							response: { isSuccess: false, statusCode }
						} ) );

						await controller.save( req, res, next );

						const message = `Unable to update report, got ${ statusCode } response code`;
						expect( next ).toHaveBeenCalledWith( new Error( message ) );
					} );
				} );
			} );
		} );
	} );

	describe( 'contacts', () => {
		it( 'Should render the contact page', () => {

			controller.contacts( req, res );

			expect( res.render ).toHaveBeenCalledWith( 'report/contacts' );
		} );
	} );

	describe( 'Contact details', () => {
		it( 'Should save the company name and id in the session and render the details page', () => {

			const contact = {
				id: 'abc-123',
				name: 'a contact name',
				something: 'else',
				another: 'thing'
			};

			req.contact = contact;
			controller.contactDetails( req, res );

			expect( req.session.reportContact ).toEqual( contact.id );
			expect( res.render ).toHaveBeenCalledWith( 'report/contact-details', { csrfToken } );
		} );
	} );

	describe( 'aboutProblem', () => {
		describe( 'When it is a GET', () => {
			it( 'Should render the view with the viewModel', () => {

				const aboutProblemViewModelResponse = { some: 'data' };

				aboutProblemViewModel.and.callFake( () => aboutProblemViewModelResponse );

				controller.aboutProblem( req, res );

				expect( aboutProblemViewModel ).toHaveBeenCalledWith( csrfToken, {} );
				expect( res.render ).toHaveBeenCalledWith( 'report/about-problem', aboutProblemViewModelResponse );
			} );
		} );

		describe( 'When it is a POST', () => {

			beforeEach( () => {

				req.method = 'POST';
				req.body = {};
			} );

			describe( 'When the required values are empty', () => {
				it( 'Should add errors', () => {

					controller.aboutProblem( req, res );

					checkFormError( 'item', 'country', 'description', 'impact', 'losses-1', 'other-companies-1' );
				} );
			} );

			describe( 'When the required values are filled', () => {
				it( 'Should render the form with the values', () => {

					const formValues = {
						item: 'test',
						commodityCode: 'test',
						country: 'test',
						description: 'test',
						impact: 'test',
						losses: 'test',
						otherCompanies: 'test'
					};
					const aboutProblemViewModelResponse = { some: 'data' };

					aboutProblemViewModel.and.callFake( () => aboutProblemViewModelResponse );

					req.body = formValues;

					controller.aboutProblem( req, res );

					expect( aboutProblemViewModel ).toHaveBeenCalledWith( csrfToken, formValues );
					expect( res.render ).toHaveBeenCalledWith( 'report/about-problem', aboutProblemViewModelResponse );
				} );
			} );
		} );
	} );
} );
