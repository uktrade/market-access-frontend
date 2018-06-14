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
			session: {}
		};
		res = {
			render: jasmine.createSpy( 'res.render' ),
			redirect: jasmine.createSpy( 'res.redirect' )
		};
		backend = {
			saveNewReport: jasmine.createSpy( 'backend.saveNewReport' )
		};
		datahub = {
			searchCompany: jasmine.createSpy( 'datahub.searchCompany' )
		};
		urls = {
			index: jasmine.createSpy( 'urls.index' ),
			report: {
				company: jasmine.createSpy( 'urls.report.company' ),
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

	describe( 'Company details', () => {
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

	describe( 'Save new', () => {

		let sessionValues;
		let companyId;
		let next;

		beforeEach( () => {

			sessionValues = { status: 1, emergency: 2 };
			companyId = '123-456';

			req.body = { companyId };

			next = jasmine.createSpy( 'next' );
		} );

		describe( 'When the reportCompany doesn\'t exist in the session', () => {
			it( 'Should redirect to the search page', async () => {

				const reportCompanyUrlResponse = '/some-url';

				urls.report.company.and.callFake( () => reportCompanyUrlResponse );

				await controller.saveNew( req, res, next );

				expect( urls.report.company ).toHaveBeenCalledWith();
				expect( res.redirect ).toHaveBeenCalledWith( reportCompanyUrlResponse );
				expect( next ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'When the company exists in the session', () => {

			let reportCompany;

			beforeEach( () => {

				reportCompany = { id: companyId, name: '456' };
				req.session = { startFormValues: sessionValues, reportCompany };
			} );

			describe( 'When the POSTed companyId does\'t match the session', () => {
				it( 'Should call next with an error', async () => {

					req.session.reportCompany.id = '789-012';

					await controller.saveNew( req, res, next );

					expect( next ).toHaveBeenCalledWith( new Error( 'Company id does\'t match session' ) );
				} );
			} );

			describe( 'When the POSTed company matches the session', () => {
				describe( 'When the response is a success and there is an id in the response', () => {

					beforeEach( () => {

						const promise = Promise.resolve( { response: { isSuccess: true }, body: { id: 1 } } );

						backend.saveNewReport.and.callFake( () => promise );
					} );

					describe( 'When the action is exit', () => {
						it( 'Should delete the session values and redirect to the dashboard', async () => {

							const indexResponse = '/index';

							urls.index.and.callFake( () => indexResponse );
							req.body.action = 'exit';

							await controller.saveNew( req, res, next );

							expect( backend.saveNewReport ).toHaveBeenCalledWith( req, sessionValues, reportCompany );
							expect( typeof req.session.startFormValues ).toEqual( 'undefined' );
							expect( typeof req.session.reportCompany ).toEqual( 'undefined' );
							expect( res.redirect ).toHaveBeenCalledWith( indexResponse );
							expect( next ).not.toHaveBeenCalled();
						} );
					} );

					describe( 'When the action is not specified', () => {
						describe( 'When there is an id in the response', () => {
							it( 'Should delete the session values and redirect to the next step', async () => {

								const contactResponse = '/index';

								urls.report.contacts.and.callFake( () => contactResponse );

								await controller.saveNew( req, res, next );

								expect( backend.saveNewReport ).toHaveBeenCalledWith( req, sessionValues, reportCompany );
								expect( typeof req.session.startFormValues ).toEqual( 'undefined' );
								expect( typeof req.session.reportCompany ).toEqual( 'undefined' );
								expect( res.redirect ).toHaveBeenCalledWith( contactResponse );
								expect( next ).not.toHaveBeenCalled();
							} );
						} );
					} );

					describe( 'When there is NOT an id in the response', () => {
						it( 'Should delete the session values and call next with an error', async () => {

							const promise = Promise.resolve( { response: { isSuccess: true }, body: {} } );
							backend.saveNewReport.and.callFake( () => promise );

							await controller.saveNew( req, res, next );

							expect( backend.saveNewReport ).toHaveBeenCalledWith( req, sessionValues, reportCompany );
							expect( typeof req.session.startFormValues ).toEqual( 'undefined' );
							expect( typeof req.session.reportCompany ).toEqual( 'undefined' );
							expect( next ).toHaveBeenCalledWith( new Error( 'No id created for report' ) );
							expect( res.redirect ).not.toHaveBeenCalled();
						} );
					} );
				} );

				describe( 'When the response is a 500', () => {
					it( 'Should call next with an error', async () => {

						const statusCode = 500;
						const promise = Promise.resolve( { response: { isSuccess: false, statusCode } } );

						backend.saveNewReport.and.callFake( () => promise );

						await controller.saveNew( req, res, next );

						expect( typeof req.session.reportCompany ).toEqual( 'undefined' );
						expect( next ).toHaveBeenCalledWith( new Error( `Unable to save report, got ${ statusCode } response code` ) );
					} );
				} );

				describe( 'When an error is thrown', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'Some backend error' );

						backend.saveNewReport.and.callFake( () => Promise.reject( err ) );

						await controller.saveNew( req, res, next );

						expect( typeof req.session.reportCompany ).toEqual( 'undefined' );
						expect( next ).toHaveBeenCalledWith( err );
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

	describe( 'saveContact', () => {

		let next;

		beforeEach( () => {

			next = jasmine.createSpy( 'next' );
			req.body = {};
			req.params = {};
		} );

		describe( 'When there is not a barrierId in the params', () => {
			it( 'Should redirect to the index page', () => {

				const indexResponse = '/index';

				urls.index.and.callFake( () => indexResponse );

				controller.saveContact( req, res, next );

				expect( res.redirect ).toHaveBeenCalledWith( indexResponse );
			} );
		} );

		describe( 'When there is a barrierId in the params', () => {

			beforeEach( () => {

				req.params.barrierId = '2';
			} );

			describe( 'When there is not a contact in the session', () => {
				it( 'Should redirect to the index page', () => {

					const indexResponse = '/index';

					urls.index.and.callFake( () => indexResponse );

					controller.saveContact( req, res, next );

					expect( res.redirect ).toHaveBeenCalledWith( indexResponse );
				} );
			} );

			describe( 'When there is a contactId in the session', () => {

				beforeEach( () => {

					req.session.reportContact = 'def-123';
				} );

				describe( 'When the POSTed contactId doesn\'t match the session', () => {
					it( 'Should call next with an error', () => {

						req.body.contactId = 'abc-123';

						controller.saveContact( req, res, next );

						expect( next ).toHaveBeenCalledWith( new Error( 'Contact id doesn\'t match session' ) );
					} );
				} );

				describe( 'When the POSTed contactId metches the session', () => {

					beforeEach( () => {

						req.body.contactId = req.session.reportContact;
						backend.saveContact = jasmine.createSpy( 'backend.saveContact' );
					} );

					describe( 'When the response is a success', () => {

						beforeEach( () => {

							backend.saveContact.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );
						} );

						it( 'Should delete the session contact', async () => {

							await controller.saveContact( req, res, next );

							expect( req.session.reportContact ).not.toBeDefined();
						} );

						describe( 'When there is an action param set to exit', () => {
							it( 'Should redirect to the index page', async () => {

								const indexResponse = '/test';

								req.body.action = 'exit';
								urls.index.and.callFake( () => indexResponse );

								await controller.saveContact( req, res, next );

								expect( urls.index ).toHaveBeenCalledWith();
								expect( res.redirect ).toHaveBeenCalledWith( indexResponse );
							} );
						} );

						describe( 'When there is NOT an action param set', () => {
							it( 'Should redirect to the index page', async () => {

								const problemResponse = '/a-problem';

								urls.report.aboutProblem.and.callFake( () => problemResponse );

								await controller.saveContact( req, res, next );

								expect( urls.report.aboutProblem ).toHaveBeenCalledWith( req.params.barrierId );
								expect( res.redirect ).toHaveBeenCalledWith( problemResponse );
							} );
						} );
					} );

					describe( 'When the response is not a success', () => {

						it( 'Should call next with an error', async () => {

							const response = { isSuccess: false, statusCode: 500 };

							backend.saveContact.and.callFake( () => Promise.resolve( { response } ) );

							await controller.saveContact( req, res, next );

							expect( next ).toHaveBeenCalledWith( new Error( `Unable to save contact, got ${ response.statusCode } response code` ) );
						} );
					} );

					describe( 'When an error is thrown', () => {

						it( 'Should call next with the error', async () => {

							const err = new Error( 'Something is broken' );

							backend.saveContact.and.callFake( () => Promise.reject( err ) );

							await controller.saveContact( req, res, next );

							expect( next ).toHaveBeenCalledWith( err );
						} );
					} );
				} );
			} );
		} );
	} );

	describe( 'aboutProblem', () => {

		it( 'Should render the view with the viewModel', () => {

			const aboutProblemViewModelResponse = { some: 'data' };

			aboutProblemViewModel.and.callFake( () => aboutProblemViewModelResponse );

			controller.aboutProblem( req, res );

			expect( aboutProblemViewModel ).toHaveBeenCalledWith( csrfToken );
			expect( res.render ).toHaveBeenCalledWith( 'report/about-problem', aboutProblemViewModelResponse );
		} );
	} );
} );
