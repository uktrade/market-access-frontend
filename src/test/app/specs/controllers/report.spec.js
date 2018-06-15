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
			params: {}
		};
		res = {
			render: jasmine.createSpy( 'res.render' ),
			redirect: jasmine.createSpy( 'res.redirect' )
		};
		backend = {
			saveNewBarrier: jasmine.createSpy( 'backend.saveNewBarrier' ),
			updateBarrier: jasmine.createSpy( 'backend.updateBarrier' )
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

					urls.report.companySearch.and.callFake( () => companyUrl );

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
	} );

	describe( 'Company details', () => {
		describe( 'When it is a POST', () => {
			describe( 'When the companyId and sessionCompany id match', () => {
				it( 'Should redirect to the contacts page', () => {

					const companyId = 'abc';
					const barrierId = '1';
					const contactResponse = '/a-link/';

					req.method = 'POST';
					req.body = { companyId };
					req.session.reportCompany = { id: companyId };
					req.params.barrierId = barrierId;

					urls.report.contacts.and.callFake( () => contactResponse );

					controller.companyDetails( req, res );

					expect( res.redirect ).toHaveBeenCalledWith( contactResponse );
					expect( urls.report.contacts ).toHaveBeenCalledWith( companyId, barrierId );
				} );
			} );

			describe( 'When the ids do not match', () => {
				it( 'Should redirect to the company search page', () => {

					const barrierId = '2';
					const searchResponse = '/another-link/';

					req.method = 'POST';
					req.body = { companyId: '123' };
					req.params.barrierId = barrierId;
					req.session.reportCompany = { id: '123-456' };

					urls.report.companySearch.and.callFake( () => searchResponse );

					controller.companyDetails( req, res );

					expect( res.redirect ).toHaveBeenCalledWith( searchResponse );
					expect( urls.report.companySearch ).toHaveBeenCalledWith( barrierId );
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

			describe( 'When there is NOT a barrierId', () => {
				describe( 'When there is an error thrown', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'tester' );

						backend.saveNewBarrier.and.callFake( () => Promise.reject( err ) );

						await controller.save( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
					} );
				} );

				describe( 'When there is not an error', () => {
					describe( 'When the response is a success', () => {
						describe( 'When there is not an id in the body', () => {
							it( 'Should call next with an error', async () => {

								backend.saveNewBarrier.and.callFake( () => Promise.resolve( {
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
								backend.saveNewBarrier.and.callFake( () => Promise.resolve( {
									response: { isSuccess: true },
									body: responseBody
								} ) );

								await controller.save( req, res, next );

								expect( req.session.barrier ).toEqual( responseBody );
								expect( res.redirect ).toHaveBeenCalledWith( aboutProblemUrl );
								expect( urls.report.aboutProblem ).toHaveBeenCalledWith( responseBody.id );
							} );
						} );
					} );

					describe( 'When the response is not a success', () => {
						it( 'Should call next with an error', async () => {

							const statusCode = 500;

							backend.saveNewBarrier.and.callFake( () => Promise.resolve( {
								response: { isSuccess: false, statusCode }
							} ) );

							await controller.save( req, res, next );

							const message = `Unable to save report, got ${ statusCode } response code`;
							expect( next ).toHaveBeenCalledWith( new Error( message ) );
						} );
					} );
				} );
			} );

			describe( 'When there is a barrierId', () => {
				it( 'Should call the update method', async () => {

					const barrierId = '3';

					req.params.barrierId = barrierId;
					req.session.reportCompany = null;
					req.barrier = {
						status: 1,
						is_emergency: 2,
						company_id: 3,
						company_name: 'fred'
					};

					await controller.save( req, res, next );

					expect( backend.updateBarrier ).toHaveBeenCalled();

					const args = backend.updateBarrier.calls.argsFor( 0 );
					expect( args[ 0 ] ).toEqual( req );
					expect( args[ 1 ] ).toEqual( barrierId );
					expect( args[ 2 ] ).toEqual( { status: req.barrier.status, emergency: req.barrier.is_emergency } );
					expect( args[ 3 ] ).toEqual( { id: req.barrier.company_id, name: req.barrier.company_name } );
					expect( args[ 4 ] ).toEqual( contactId );
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

		it( 'Should render the view with the viewModel', () => {

			const aboutProblemViewModelResponse = { some: 'data' };

			aboutProblemViewModel.and.callFake( () => aboutProblemViewModelResponse );

			controller.aboutProblem( req, res );

			expect( aboutProblemViewModel ).toHaveBeenCalledWith( csrfToken );
			expect( res.render ).toHaveBeenCalledWith( 'report/about-problem', aboutProblemViewModelResponse );
		} );
	} );
} );
