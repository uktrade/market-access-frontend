const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

const modulePath = './controllers';

describe( 'Report controller', () => {

	let controller;
	let req;
	let res;
	let next;
	let datahub;
	let backend;
	let urls;
	let csrfToken;
	let metadata;
	let Form;
	let form;
	let getValuesResponse;
	let getTemplateValuesResponse;
	let validators;
	let reportDetailViewModel;
	let reportsViewModel;

	beforeEach( () => {

		csrfToken = uuid();
		metadata = {
			reportTaskList: [ { a: 1, b: 2 }, { c: 3, d: 4 } ],
			statusTypes: { a: 1, b: 2 },
			bool: { 'true': 'Yes', 'false': 'No' },
			boolScale: { '1': 'Yes', '2': 'No' },
			lossScale: { '1': '1', '2': '2' },
			govResponse: { '1': 'z', 'b': 'y' },
			publishResponse: { a: 1, b: 2 },
			countries: [
				{ id: 1, name: 'country 1' },
				{ id: 2, name: 'country 2' }
			],
			barrierTypes: [
				{ id: 1, title: 'barrier 1', category: 'GOODS' },
				{ id: 2, title: 'barrier 2', category: 'SERVICES' }
			],
			barrierTypeCategories: {
				'GOODS': 'title 1',
				'SERVICES': 'title 2'
			},
			supportType: { '1': 'x', '2': 'y', '3': 'z' }
		};

		req = {
			query: {},
			csrfToken: () => csrfToken,
			session: {},
			params: {},
			error: jasmine.createSpy( 'req.error' ),
			hasErrors: jasmine.createSpy( 'req.hasErrors' )
		};
		res = {
			render: jasmine.createSpy( 'res.render' ),
			redirect: jasmine.createSpy( 'res.redirect' )
		};
		next = jasmine.createSpy( 'next' );
		backend = {
			reports: {
				save: jasmine.createSpy( 'backend.reports.save' ),
				update: jasmine.createSpy( 'backend.reports.update' ),
				saveProblem: jasmine.createSpy( 'backend.reports.saveProblem' ),
				saveImpact: jasmine.createSpy( 'backend.reports.saveImpact' ),
				saveLegal: jasmine.createSpy( 'backend.reports.saveLegal' ),
				saveBarrierType: jasmine.createSpy( 'backend.reports.saveBarrierType' ),
				saveSupport: jasmine.createSpy( 'backend.reports.saveSupport' ),
				saveNextSteps: jasmine.createSpy( 'backend.reports.saveNextSteps' ),
				submit: jasmine.createSpy( 'backend.reports.submit' ),
				getAll: jasmine.createSpy( 'backend.reports.getAll' ),
				getAllUnfinished: jasmine.createSpy( 'backend.reports.getAllUnfinished' )
			}
		};
		datahub = {
			searchCompany: jasmine.createSpy( 'datahub.searchCompany' )
		};
		urls = {
			index: jasmine.createSpy( 'urls.index' ),
			reports: {
				companySearch: jasmine.createSpy( 'urls.reports.companySearch' ),
				companyDetails: jasmine.createSpy( 'urls.reports.companyDetails' ),
				contacts: jasmine.createSpy( 'urls.reports.contacts' ),
				aboutProblem: jasmine.createSpy( 'urls.reports.aboutProblem' ),
				impact: jasmine.createSpy( 'urls.reports.impact' ),
				legal: jasmine.createSpy( 'urls.reports.legal' ),
				typeCategory: jasmine.createSpy( 'urls.reports.typeCategory' ),
				type: jasmine.createSpy( 'urls.reports.type' ),
				support: jasmine.createSpy( 'urls.reports.support' ),
				nextSteps: jasmine.createSpy( 'urls.reports.nextSteps' ),
				detail: jasmine.createSpy( 'urls.reports.detail' ),
				success: jasmine.createSpy( 'urls.reports.success' )
			}
		};

		getValuesResponse = { a: 1, b: 2 };
		getTemplateValuesResponse = { c: 3, d: 4 };
		form = {
			validate: jasmine.createSpy( 'form.validate' ),
			getValues: jasmine.createSpy( 'form.getValues' ).and.callFake( () => getValuesResponse ),
			getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.callFake( () => getTemplateValuesResponse )
		};
		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );
		reportDetailViewModel = jasmine.createSpy( 'reportDetailViewModel' );
		reportsViewModel = jasmine.createSpy( 'reportsViewModel' );

		validators = {
			isMetadata: jasmine.createSpy( 'validators.isMetaData' ),
			isCountry: jasmine.createSpy( 'validators.isCountry' ),
			isOneBoolCheckboxChecked: jasmine.createSpy( 'validators.isOneBoolCheckboxChecked' ),
			isBarrierType: jasmine.createSpy( 'validators.isBarrierType' )
		};

		controller = proxyquire( modulePath, {
			'../../lib/backend-service': backend,
			'../../lib/datahub-service': datahub,
			'../../lib/urls': urls,
			'../../lib/metadata': metadata,
			'../../lib/Form': Form,
			'../../lib/validators': validators,
			'./view-models/detail': reportDetailViewModel,
			'./view-models/reports': reportsViewModel
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
		describe( 'Without an error', () => {
			describe( 'With a success response', () => {
				it( 'Should get the reports and render the index page', async () => {

					const unfinishedReportsResponse = {
						response: { isSuccess: true  },
						body: {
							results: [ { id: 1 } ]
						}
					};
					const reportsViewModelResponse = { reports: true };

					reportsViewModel.and.callFake( () => reportsViewModelResponse );
					backend.reports.getAllUnfinished.and.callFake( () => Promise.resolve( unfinishedReportsResponse ) );

					await controller.index( req, res, next );

					expect( next ).not.toHaveBeenCalled();
					expect( backend.reports.getAllUnfinished ).toHaveBeenCalledWith( req );
					expect( reportsViewModel ).toHaveBeenCalledWith( unfinishedReportsResponse.body.results );
					expect( res.render ).toHaveBeenCalledWith( 'reports/views/index', reportsViewModelResponse );
				} );
			} );

			describe( 'Without a success response', () => {
				it( 'Should get the reports and render the index page', async () => {

					const unfinishedReportsResponse = {
						response: { isSuccess: false  },
						body: {}
					};

					backend.reports.getAllUnfinished.and.callFake( () => Promise.resolve( unfinishedReportsResponse ) );

					await controller.index( req, res, next );

					expect( next ).toHaveBeenCalledWith( new Error( `Got ${ unfinishedReportsResponse.response.statusCode } response from backend` ) );
					expect( backend.reports.getAllUnfinished ).toHaveBeenCalledWith( req );
					expect( res.render ).not.toHaveBeenCalled();
				} );
			} );
		} );

		describe( 'With an error', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'issue with backend' );

				backend.reports.getAllUnfinished.and.callFake( () => Promise.reject( err ) );

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

	describe( 'Start', () => {

		let ssoToken;

		beforeEach( () => {

			ssoToken = uuid();
			req.session = { ssoToken };
		} );

		it( 'Should setup the form correctly', () => {

			const statusTypesResponse = { status: 1 };
			const boolResponse = { bool: 1 };
			const report = {
				problem_status: 'report status',
				is_emergency: 'report emergency'
			};
			const sessionValues = {
				status: 'session status',
				emergency: 'session emergency'
			};

			req.session.startFormValues = sessionValues;
			req.report = report;

			validators.isMetadata.and.callFake( ( key ) => {

				if( key === 'statusTypes' ){ return statusTypesResponse; }
				if( key === 'bool' ){ return boolResponse; }
			} );

			controller.start( req, res );

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];

			expect( Form ).toHaveBeenCalled();
			expect( args[ 0 ] ).toEqual( req );

			expect( config.status ).toBeDefined();
			expect( config.status.values ).toEqual( [ sessionValues.status, report.problem_status ] );
			expect( config.status.validators[ 0 ].fn ).toEqual( statusTypesResponse );

			expect( config.emergency ).toBeDefined();
			expect( config.emergency.values ).toEqual( [ sessionValues.emergency, report.is_emergency ] );
			expect( config.emergency.conditional ).toEqual( { name: 'status', values: [ '1', '2' ] } );
			expect( config.emergency.validators[ 0 ].fn ).toEqual( boolResponse );
		} );

		describe( 'When it is a POST', () => {

			beforeEach( () => {

				req.method = 'POST';
				req.body = {};
				form.isPost = true;
			} );

			describe( 'When the input values are valid', () => {

				it( 'Should save the values and redirect to the next step', () => {

					const companyUrl = 'my-url';
					const status = '123';
					const emergency = '456';

					req.body = { status, emergency };
					form.hasErrors = () => false;

					urls.reports.companySearch.and.callFake( () => companyUrl );

					controller.start( req, res );

					expect( form.validate ).toHaveBeenCalled();
					expect( req.session.startFormValues ).toEqual( getValuesResponse );
					expect( res.redirect ).toHaveBeenCalledWith( companyUrl );
				} );
			} );

			describe( 'When no input values are given', () => {

				beforeEach( () => {

					req.session.startFormValues = { test: 1 };
					form.hasErrors = () => true;
				} );

				it( 'Should not save the values to the session', () => {

					controller.start( req, res );
					expect( req.session.startFormValues ).not.toBeDefined();
				} );
			} );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the start page with the form values', () => {

				const sessionValues = { status: 1, emergency: 2 };

				req.session.startFormValues = sessionValues;
				req.report = { id: 1, test: 2 };

				controller.start( req, res );

				expect( form.getTemplateValues ).toHaveBeenCalledWith();
				expect( res.render ).toHaveBeenCalledWith( 'reports/views/start', getTemplateValuesResponse );
			} );
		} );
	} );

	describe( 'Company Search', () => {

		const template = 'reports/views/company-search';

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

				describe( 'When the user does not have permission to use the API', () => {
					it( 'Should render an error message', async () => {

						const promise = Promise.resolve( { response: { isSuccess: false, statusCode: 403 } } );

						datahub.searchCompany.and.callFake( () => promise );

						await controller.companySearch( req, res, next );

						expect( res.render ).toHaveBeenCalledWith( template, { query, error: 'You do not have permission to search for a company, please contact Data Hub support.' } );
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
					req.report = { id: reportId };

					urls.reports.contacts.and.callFake( () => contactResponse );

					controller.companyDetails( req, res );

					expect( res.redirect ).toHaveBeenCalledWith( contactResponse );
					expect( urls.reports.contacts ).toHaveBeenCalledWith( companyId, reportId );
				} );
			} );

			describe( 'When the ids do not match', () => {
				it( 'Should redirect to the company search page', () => {

					const reportId = '2';
					const searchResponse = '/another-link/';

					req.method = 'POST';
					req.body = { companyId: '123' };
					req.report = { id: reportId };
					req.session.reportCompany = { id: '123-456' };

					urls.reports.companySearch.and.callFake( () => searchResponse );

					controller.companyDetails( req, res );

					expect( res.redirect ).toHaveBeenCalledWith( searchResponse );
					expect( urls.reports.companySearch ).toHaveBeenCalledWith( reportId );
				} );
			} );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should save the company name and id in the session and render the details page', () => {

				const company = {
					id: 'abc-123',
					name: 'a company name',
					something: 'else',
					another: 'thing',
					sector: {
						id: 1,
						name: 'a sector'
					}
				};

				req.company = company;
				controller.companyDetails( req, res );

				expect( req.session.reportCompany ).toEqual( { id: company.id, name: company.name, sector: company.sector } );
				expect( res.render ).toHaveBeenCalledWith( 'reports/views/company-details', { csrfToken } );
			} );
		} );
	} );

	describe( 'Save', () => {

		beforeEach( () => {

			req.body = {};
		} );

		describe( 'When there is not a contact in the session', () => {
			it( 'Should redirect to the contacts page', async () => {

				const contactsResponse = '/contacts';
				const sessionCompany = { id: '123-456' };

				req.session.reportCompany = sessionCompany;

				urls.reports.contacts.and.callFake( () => contactsResponse );

				await controller.save( req, res, next );

				expect( res.redirect ).toHaveBeenCalledWith( contactsResponse );
				expect( urls.reports.contacts ).toHaveBeenCalledWith( sessionCompany.id );
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
				req.session.startFormValues = { status: 1 };
				req.session.reportContact = contactId;
				req.session.reportCompany = { id: 1 };
			} );

			function checkSession(){

				expect( req.session.startFormValues ).not.toBeDefined();
				expect( req.session.reportContact ).not.toBeDefined();
				expect( req.session.reportCompany ).not.toBeDefined();
			}

			describe( 'When there is NOT a report', () => {
				describe( 'When there is an error thrown', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'tester' );

						backend.reports.save.and.callFake( () => Promise.reject( err ) );

						await controller.save( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
					} );
				} );

				describe( 'When there is not an error', () => {
					describe( 'When the response is a success', () => {

						afterEach( () => checkSession() );

						describe( 'When there is not an id in the body', () => {
							it( 'Should call next with an error', async () => {

								backend.reports.save.and.callFake( () => Promise.resolve( {
									response: { isSuccess: true },
									body: {}
								} ) );

								await controller.save( req, res, next );

								expect( next ).toHaveBeenCalledWith( new Error( 'No id created for report' ) );
							} );
						} );

						describe( 'When there is an id in the body', () => {

							let responseBody;

							beforeEach( () => {

								responseBody = { id: 1, name: 2 };
								backend.reports.save.and.callFake( () => Promise.resolve( {
									response: { isSuccess: true },
									body: responseBody
								} ) );
							} );

							describe( 'When the action is exit', () => {
								it( 'Should put the body in the session and redirect', async () => {

									const detailUrl = '/b-test';
									req.body.action = 'exit';

									urls.reports.detail.and.callFake( () => detailUrl );

									await controller.save( req, res, next );

									//expect( req.session.report ).toEqual( responseBody );
									expect( res.redirect ).toHaveBeenCalledWith( detailUrl );
									expect( urls.reports.detail ).toHaveBeenCalledWith( responseBody.id );
								} );
							} );

							describe( 'When the action is NOT exit', () => {
								it( 'Should call the correct backend method', async () => {

									const values = Object.assign( {},
										req.session.startFormValues,
										{ company: req.session.reportCompany },
										{ contactId }
									);

									await controller.save( req, res, next );

									expect( backend.reports.save ).toHaveBeenCalled();

									const args = backend.reports.save.calls.argsFor( 0 );

									expect( args[ 0 ] ).toEqual( req );
									expect( args[ 1 ] ).toEqual( values );
								} );

								it( 'Should put the body in the session and redirect', async () => {

									const aboutProblemUrl = '/a-test';

									urls.reports.aboutProblem.and.callFake( () => aboutProblemUrl );

									await controller.save( req, res, next );

									//expect( req.session.report ).toEqual( responseBody );
									expect( res.redirect ).toHaveBeenCalledWith( aboutProblemUrl );
									expect( urls.reports.aboutProblem ).toHaveBeenCalledWith( responseBody.id );
								} );
							} );
						} );
					} );

					describe( 'When the response is not a success', () => {
						it( 'Should call next with an error', async () => {

							const statusCode = 500;

							backend.reports.save.and.callFake( () => Promise.resolve( {
								response: { isSuccess: false, statusCode }
							} ) );

							await controller.save( req, res, next );

							const message = `Unable to save report, got ${ statusCode } response code`;
							expect( next ).toHaveBeenCalledWith( new Error( message ) );
						} );
					} );
				} );
			} );

			describe( 'When there is a report', () => {
				describe( 'When the response is a success', () => {
					it( 'Should call the update method', async () => {

						const reportId = '3';

						delete req.session.startFormValues;
						delete req.session.reportCompany;

						req.report = {
							id: reportId,
							problem_status: 1,
							is_emergency: 2,
							company_id: 3,
							company_name: 'fred'
						};

						await controller.save( req, res, next );

						expect( backend.reports.update ).toHaveBeenCalled();

						const args = backend.reports.update.calls.argsFor( 0 );
						expect( args[ 0 ] ).toEqual( req );
						expect( args[ 1 ] ).toEqual( reportId );
						expect( args[ 2 ] ).toEqual( {
							status: req.report.problem_status,
							emergency: ( req.report.is_emergency + '' ),
							company: {
								id: req.report.company_id,
								name: req.report.company_name
							},
							contactId
						} );
					} );
				} );

				describe( 'When the response is not a success', () => {
					it( 'Should call next with an error', async () => {

						const statusCode = 500;

						req.report = { id: 12 };

						backend.reports.update.and.callFake( () => Promise.resolve( {
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

			expect( res.render ).toHaveBeenCalledWith( 'reports/views/contacts' );
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
			expect( res.render ).toHaveBeenCalledWith( 'reports/views/contact-details', { csrfToken } );
		} );
	} );

	describe( 'aboutProblem', () => {

		let report;

		beforeEach( () => {

			report = {
				product: 'myProduct',
				commodity_codes: 'code 1, code 2',
				export_country: 'a country',
				problem_description: 'a description',
				barrier_title: 'barrier_title',
			};
			req.report = report;
		} );

		it( 'Should setup the form correctly', () => {

			const lossScaleResponse = { lossScale: 1 };
			const boolScaleResponse = { boolScale: 1 };

			validators.isMetadata.and.callFake( ( key ) => {

				if( key === 'lossScale' ){ return lossScaleResponse; }
				if( key === 'boolScale' ){ return boolScaleResponse; }
			} );

			controller.aboutProblem( req, res );

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];

			expect( Form ).toHaveBeenCalled();
			expect( args[ 0 ] ).toEqual( req );

			expect( config.item ).toBeDefined();
			expect( config.item.required ).toBeDefined();
			expect( config.item.values ).toEqual( [ report.product ] );

			expect( config.commodityCode ).toBeDefined();
			expect( config.commodityCode.values ).toEqual( [ report.commodity_codes ] );

			expect( config.country ).toBeDefined();
			expect( config.country.values ).toEqual( [ report.export_country ] );
			expect( config.country.validators[ 0 ].fn ).toEqual( validators.isCountry );

			expect( config.description ).toBeDefined();
			expect( config.description.values ).toEqual( [ report.problem_description ] );
			expect( config.description.required ).toBeDefined();

			expect( config.barrierTitle ).toBeDefined();
			expect( config.barrierTitle.values ).toEqual( [ report.barrier_title ] );
			expect( config.barrierTitle.required ).toBeDefined();
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the view with the viewModel', async () => {

				await controller.aboutProblem( req, res, next );

				expect( form.validate ).not.toHaveBeenCalled();
				expect( form.getTemplateValues ).toHaveBeenCalledWith();
				expect( res.render ).toHaveBeenCalledWith( 'reports/views/about-problem', getTemplateValuesResponse );
			} );
		} );

		describe( 'When it is a POST', () => {

			beforeEach( () => {

				req.body = {};
				form.isPost = true;
			} );

			afterEach( () => {

				expect( form.validate ).toHaveBeenCalled();
			} );

			describe( 'When the required values are empty', () => {
				it( 'Should render the template', async () => {

					form.hasErrors = () => true;

					await controller.aboutProblem( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( 'reports/views/about-problem', getTemplateValuesResponse );
				} );
			} );

			describe( 'When the required values are filled', () => {
				describe( 'When the response is a success', () => {

					beforeEach( () => {

						backend.reports.saveProblem.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );

						req.report = { id: 1, b: 2 };
						form.hasErrors = () => false;
					} );

					afterEach( () => {

						expect( next ).not.toHaveBeenCalled();
						expect( backend.reports.saveProblem ).toHaveBeenCalledWith( req, req.report.id, getValuesResponse );
					} );

					describe( 'When save and exit is used to submit the form', () => {
						it( 'Should redirect to the report detail page', async () => {

							const reportDetailResponse = '/reportDetail';
							urls.reports.detail.and.callFake( () => reportDetailResponse );
							form.isExit = true;

							await controller.aboutProblem( req, res, next );

							expect( urls.reports.detail ).toHaveBeenCalledWith( req.report.id );
							expect( res.redirect ).toHaveBeenCalledWith( reportDetailResponse );
						} );
					} );

					describe( 'When save and continue is used to submit the form', () => {
						it( 'Should redirect', async () => {

							const impactUrlResponse = '/impact/';
							urls.reports.impact.and.callFake( () => impactUrlResponse );

							await controller.aboutProblem( req, res, next );

							expect( urls.reports.impact ).toHaveBeenCalledWith( req.report.id );
							expect( res.redirect ).toHaveBeenCalledWith( impactUrlResponse );
						} );
					} );
				} );

				describe( 'When the response is not a success', () => {
					it( 'Should call next with an error', async () => {

						const statusCode = 500;
						form.hasErrors = () => false;
						backend.reports.saveProblem.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

						await controller.aboutProblem( req, res, next );

						expect( next ).toHaveBeenCalledWith( new Error( `Unable to save report, got ${ statusCode } from backend` ) );
					} );
				} );

				describe( 'When the request fails', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'my test' );
						form.hasErrors = () => false;
						backend.reports.saveProblem.and.callFake( () => Promise.reject( err ) );

						await controller.aboutProblem( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
					} );
				} );
			} );
		} );
	} );

	describe( 'impact', () => {

		let report;

		beforeEach( () => {

			report = {
				problem_impact: 'problem_impact',
				estimated_loss_range: 'estimated_loss_range',
				other_companies_affected: 'other_companies_affected',
				other_companies_info: 'other_companies_info'
			};

			req.report = report;
		} );

		it( 'Should setup the form correctly', () => {

			const lossScaleResponse = { lossScaleResponse: 1 };
			const boolScaleResponse = { boolScaleResponse: 2 };


			validators.isMetadata.and.callFake( ( key ) => {

				if( key === 'lossScale' ){ return lossScaleResponse; }
				if( key === 'boolScale' ){ return boolScaleResponse; }
			} );

			controller.impact( req, res, next );

			expect( Form ).toHaveBeenCalled();

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];

			expect( args[ 0 ] ).toEqual( req );

			expect( config.impact ).toBeDefined();
			expect( config.impact.values ).toEqual( [ report.problem_impact ] );
			expect( config.impact.required ).toEqual( 'Describe the impact of the problem' );

			expect( config.losses ).toBeDefined();
			expect( config.losses.type ).toEqual( Form.RADIO );
			expect( config.losses.values ).toEqual( [ report.estimated_loss_range ] );
			expect( config.losses.validators[ 0 ].fn ).toEqual( lossScaleResponse );

			expect( config.otherCompanies ).toBeDefined();
			expect( config.otherCompanies.type ).toEqual( Form.RADIO );
			expect( config.otherCompanies.values ).toEqual( [ report.other_companies_affected ] );
			expect( config.otherCompanies.validators[ 0 ].fn ).toEqual( boolScaleResponse );

			expect( config.otherCompaniesInfo ).toBeDefined();
			expect( config.otherCompaniesInfo.values ).toEqual( [ report.other_companies_info ] );
			expect( config.otherCompaniesInfo.conditional ).toEqual( { name: 'otherCompanies', value: '1' } );
			expect( config.otherCompaniesInfo.required ).toBeDefined();
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the view with the viewModel', async () => {

				await controller.impact( req, res, next );

				expect( form.validate ).not.toHaveBeenCalled();
				expect( form.getTemplateValues ).toHaveBeenCalledWith();
				expect( res.render ).toHaveBeenCalledWith( 'reports/views/impact', getTemplateValuesResponse );
			} );
		} );

		describe( 'When it is a POST', () => {

			beforeEach( () => {

				req.body = {};
				form.isPost = true;
			} );

			afterEach( () => {

				expect( form.validate ).toHaveBeenCalled();
			} );

			describe( 'When the required values are empty', () => {
				it( 'Should render the template', async () => {

					form.hasErrors = () => true;

					await controller.impact( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( 'reports/views/impact', getTemplateValuesResponse );
				} );
			} );

			describe( 'When the required values are filled', () => {
				describe( 'When the response is a success', () => {

					beforeEach( () => {

						backend.reports.saveImpact.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );

						req.report = { id: 1, b: 2 };
						form.hasErrors = () => false;
					} );

					afterEach( () => {

						expect( next ).not.toHaveBeenCalled();
						expect( backend.reports.saveImpact ).toHaveBeenCalledWith( req, req.report.id, getValuesResponse );
					} );

					describe( 'When save and exit is used to submit the form', () => {
						it( 'Should redirect to the report detail page', async () => {

							const reportDetailResponse = '/reportDetail';
							urls.reports.detail.and.callFake( () => reportDetailResponse );
							form.isExit = true;

							await controller.impact( req, res, next );

							expect( urls.reports.detail ).toHaveBeenCalledWith( req.report.id );
							expect( res.redirect ).toHaveBeenCalledWith( reportDetailResponse );
						} );
					} );

					describe( 'When save and continue is used to submit the form', () => {
						it( 'Should redirect', async () => {

							const legalResponse = '/legal/';
							urls.reports.legal.and.callFake( () => legalResponse );

							await controller.impact( req, res, next );

							expect( urls.reports.legal ).toHaveBeenCalledWith( req.report.id );
							expect( res.redirect ).toHaveBeenCalledWith( legalResponse );
						} );
					} );
				} );

				describe( 'When the response is not a success', () => {
					it( 'Should call next with an error', async () => {

						const statusCode = 500;
						form.hasErrors = () => false;
						backend.reports.saveImpact.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

						await controller.impact( req, res, next );

						expect( next ).toHaveBeenCalledWith( new Error( `Unable to save report, got ${ statusCode } from backend` ) );
					} );
				} );

				describe( 'When the request fails', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'my test' );
						form.hasErrors = () => false;
						backend.reports.saveImpact.and.callFake( () => Promise.reject( err ) );

						await controller.impact( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
					} );
				} );
			} );
		} );
	} );

	describe( 'legal', () => {

		let report;

		beforeEach( () => {

			report = {
				has_legal_infringement: 'has_legal_infringement',
				wto_infingment: 'wto_infingment',
				fta_infingment: 'fta_infingment',
				other_infingment: 'other_infingment',
				infringement_summary: 'infringement_summary'
			};

			req.report = report;
		} );

		it( 'Should setup the form correctly', () => {

			const boolScaleResponse = { boolScaleResponse: 2 };

			validators.isMetadata.and.callFake( ( key ) => {

				if( key === 'boolScale' ){ return boolScaleResponse; }
			} );

			controller.legal( req, res, next );

			expect( Form ).toHaveBeenCalled();

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];

			expect( args[ 0 ] ).toEqual( req );

			expect( config.hasInfringed ).toBeDefined();
			expect( config.hasInfringed.type ).toEqual( Form.RADIO );
			expect( config.hasInfringed.values ).toEqual( [ report.has_legal_infringement ] );
			expect( config.hasInfringed.validators[ 0 ].fn ).toEqual( boolScaleResponse );

			expect( config.infringements ).toBeDefined();
			expect( config.infringements.type ).toEqual( Form.CHECKBOXES );
			expect( config.infringements.items.wtoInfringement.values ).toEqual( [ report.wto_infingement ] );
			expect( config.infringements.items.ftaInfringement.values ).toEqual( [ report.fta_infingement ] );
			expect( config.infringements.items.otherInfringement.values ).toEqual( [ report.other_infingement ] );
			expect( config.infringements.validators[ 0 ].fn ).toEqual( validators.isOneBoolCheckboxChecked );

			expect( config.infringementSummary ).toBeDefined();
			expect( config.infringementSummary.values ).toEqual( [ report.infringement_summary ] );
			expect( config.infringementSummary.conditional ).toEqual( { name: 'hasInfringed', value: '1' } );
			expect( config.infringementSummary.required ).toBeDefined();
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the view with the viewModel', async () => {

				await controller.legal( req, res, next );

				expect( form.validate ).not.toHaveBeenCalled();
				expect( form.getTemplateValues ).toHaveBeenCalledWith();
				expect( res.render ).toHaveBeenCalledWith( 'reports/views/legal', getTemplateValuesResponse );
			} );
		} );

		describe( 'When it is a POST', () => {

			beforeEach( () => {

				req.body = {};
				form.isPost = true;
			} );

			afterEach( () => {

				expect( form.validate ).toHaveBeenCalled();
			} );

			describe( 'When the required values are empty', () => {
				it( 'Should render the template', async () => {

					form.hasErrors = () => true;

					await controller.legal( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( 'reports/views/legal', getTemplateValuesResponse );
				} );
			} );

			describe( 'When the required values are filled', () => {
				describe( 'When the response is a success', () => {

					beforeEach( () => {

						backend.reports.saveLegal.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );

						req.report = { id: 1, b: 2 };
						form.hasErrors = () => false;
					} );

					afterEach( () => {

						expect( next ).not.toHaveBeenCalled();
						expect( backend.reports.saveLegal ).toHaveBeenCalledWith( req, req.report.id, getValuesResponse );
					} );

					describe( 'When save and exit is used to submit the form', () => {
						it( 'Should redirect to the report detail page', async () => {

							const reportDetailResponse = '/reportDetail';
							urls.reports.detail.and.callFake( () => reportDetailResponse );
							form.isExit = true;

							await controller.legal( req, res, next );

							expect( urls.reports.detail ).toHaveBeenCalledWith( req.report.id );
							expect( res.redirect ).toHaveBeenCalledWith( reportDetailResponse );
						} );
					} );

					describe( 'When save and continue is used to submit the form', () => {
						it( 'Should redirect', async () => {

							const typeCategoryResponse = '/type-category/';
							urls.reports.typeCategory.and.callFake( () => typeCategoryResponse );

							await controller.legal( req, res, next );

							expect( urls.reports.typeCategory ).toHaveBeenCalledWith( req.report.id );
							expect( res.redirect ).toHaveBeenCalledWith( typeCategoryResponse );
						} );
					} );
				} );

				describe( 'When the response is not a success', () => {
					it( 'Should call next with an error', async () => {

						const statusCode = 500;
						form.hasErrors = () => false;
						backend.reports.saveLegal.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

						await controller.legal( req, res, next );

						expect( next ).toHaveBeenCalledWith( new Error( `Unable to save report, got ${ statusCode } from backend` ) );
					} );
				} );

				describe( 'When the request fails', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'my test' );
						form.hasErrors = () => false;
						backend.reports.saveLegal.and.callFake( () => Promise.reject( err ) );

						await controller.legal( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
					} );
				} );
			} );
		} );
	} );

	describe( 'typeCategory', () => {

		let ssoToken;
		let report;

		beforeEach( () => {

			ssoToken = uuid();
			req.session = { ssoToken };
			report = {
				id: 123,
				barrier_type_category: 'barrier_type_category'
			};
			req.report = report;
		} );

		it( 'Should setup the form correctly', () => {

			const barrierTypeCategories = { barrierTypeCategories: 1 };
			const sessionValues = {
				category: 'GOODS',
			};

			req.session.typeCategoryValues = sessionValues;

			validators.isMetadata.and.callFake( () => barrierTypeCategories );

			controller.typeCategory( req, res );

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];

			expect( Form ).toHaveBeenCalled();
			expect( args[ 0 ] ).toEqual( req );

			expect( config.category ).toBeDefined();
			expect( config.category.values ).toEqual( [ sessionValues.category, report.barrier_type_category ] );
			expect( config.category.items.length ).toEqual( Object.entries( metadata.barrierTypeCategories ).length );
			expect( config.category.validators[ 0 ].fn ).toEqual( barrierTypeCategories );
		} );

		describe( 'When it is a POST', () => {

			beforeEach( () => {

				req.method = 'POST';
				req.body = {};
				form.isPost = true;
			} );

			describe( 'When the input values are valid', () => {

				it( 'Should save the values and redirect to the next step', () => {

					const typeUrl = 'my-url';
					const status = '123';
					const emergency = '456';

					req.body = { status, emergency };
					form.hasErrors = () => false;

					urls.reports.type.and.callFake( () => typeUrl );

					controller.typeCategory( req, res );

					expect( form.validate ).toHaveBeenCalled();
					expect( req.session.typeCategoryValues ).toEqual( getValuesResponse );
					expect( res.redirect ).toHaveBeenCalledWith( typeUrl );
				} );
			} );

			describe( 'When no input values are given', () => {

				beforeEach( () => {

					req.session.typeCategoryValues = { test: 1 };
					form.hasErrors = () => true;
				} );

				it( 'Should not save the values to the session', () => {

					controller.typeCategory( req, res );
					expect( req.session.typeCategoryValues ).not.toBeDefined();
				} );
			} );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the start page with the form values', () => {

				const sessionValues = { category: 'GOODS' };

				req.session.typeCategoryValues = sessionValues;

				controller.typeCategory( req, res );

				expect( form.getTemplateValues ).toHaveBeenCalledWith();
				expect( res.render ).toHaveBeenCalledWith( 'reports/views/type-category', getTemplateValuesResponse );
			} );
		} );
	} );

	describe( 'type', () => {

		let report;
		let templateData;

		beforeEach( () => {

			report = {
				id: 123,
				barrier_type_id: 456
			};

			req.report = report;
			req.session.typeCategoryValues = { category: 'GOODS' };

			getTemplateValuesResponse = {
				barrierType: [
					{ value: 1, text: 'barrier 1', category: 'GOODS' },
					{ value: 2, text: 'barrier 2', category: 'SERVICES' }
				]
			};

			templateData = Object.assign(
				getTemplateValuesResponse,
				{ title: metadata.barrierTypeCategories.GOODS }
			);
		} );

		it( 'Should setup the form correctly', () => {

			controller.type( req, res, next );

			expect( Form ).toHaveBeenCalled();

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];
			const goodsBarrierType = metadata.barrierTypes[ 0 ];

			expect( args[ 0 ] ).toEqual( req );

			expect( config.barrierType ).toBeDefined();
			expect( config.barrierType.type ).toEqual( Form.RADIO );
			expect( config.barrierType.items ).toEqual( [{
				value: goodsBarrierType.id,
				text: goodsBarrierType.title,
				category: goodsBarrierType.category
			}] );
			expect( config.barrierType.values ).toEqual( [ report.barrier_type_id ] );
			expect( config.barrierType.validators[ 0 ].fn ).toEqual( validators.isBarrierType );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the view with the viewModel', async () => {

				await controller.type( req, res, next );

				expect( form.validate ).not.toHaveBeenCalled();
				expect( form.getTemplateValues ).toHaveBeenCalledWith();
				expect( res.render ).toHaveBeenCalledWith( 'reports/views/type', templateData );
			} );
		} );

		describe( 'When it is a POST', () => {

			beforeEach( () => {

				req.body = {};
				form.isPost = true;
			} );

			afterEach( () => {

				expect( form.validate ).toHaveBeenCalled();
			} );

			describe( 'When the required values are empty', () => {
				it( 'Should render the template', async () => {

					form.hasErrors = () => true;

					await controller.type( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( 'reports/views/type', templateData );
				} );
			} );

			describe( 'When the required values are filled', () => {
				describe( 'When the response is a success', () => {

					beforeEach( () => {

						backend.reports.saveBarrierType.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );

						req.report = { id: 1, b: 2 };
						form.hasErrors = () => false;
					} );

					afterEach( () => {

						expect( next ).not.toHaveBeenCalled();
						expect( req.session.typeCategoryValues ).not.toBeDefined();
						expect( backend.reports.saveBarrierType ).toHaveBeenCalledWith( req, req.report.id, getValuesResponse );
					} );

					describe( 'When save and exit is used to submit the form', () => {
						it( 'Should redirect to the report detail page', async () => {

							const reportDetailResponse = '/reportDetail';
							urls.reports.detail.and.callFake( () => reportDetailResponse );
							form.isExit = true;

							await controller.type( req, res, next );

							expect( urls.reports.detail ).toHaveBeenCalledWith( req.report.id );
							expect( res.redirect ).toHaveBeenCalledWith( reportDetailResponse );
						} );
					} );

					describe( 'When save and continue is used to submit the form', () => {
						it( 'Should redirect', async () => {

							const supportResponse = '/support/';
							urls.reports.support.and.callFake( () => supportResponse );

							await controller.type( req, res, next );

							expect( urls.reports.support ).toHaveBeenCalledWith( req.report.id );
							expect( res.redirect ).toHaveBeenCalledWith( supportResponse );
						} );
					} );
				} );

				describe( 'When the response is not a success', () => {
					it( 'Should call next with an error', async () => {

						const statusCode = 500;
						form.hasErrors = () => false;
						backend.reports.saveBarrierType.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

						await controller.type( req, res, next );

						expect( next ).toHaveBeenCalledWith( new Error( `Unable to save report, got ${ statusCode } from backend` ) );
					} );
				} );

				describe( 'When the request fails', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'my test' );
						form.hasErrors = () => false;
						backend.reports.saveBarrierType.and.callFake( () => Promise.reject( err ) );

						await controller.type( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
					} );
				} );
			} );
		} );
	} );

	describe( 'support', () => {

		let report;

		beforeEach( () => {

			report = {
				is_resolved: 'is_resolved',
				support_type: 'support_type',
				steps_taken: 'steps_taken',
				is_politically_sensitive: 'is_politically_sensitive',
				political_sensitivity_summary: 'political_sensitivity_summary'
			};

			req.report = report;
		} );

		it( 'Should setup the form correctly', () => {

			const boolResponse = { boolResponse: 2 };
			const supportTypeResponse = { supportTypeResponse: 2 };

			validators.isMetadata.and.callFake( ( key ) => {

				if( key === 'bool' ){ return boolResponse; }
				if( key === 'supportType' ){ return supportTypeResponse; }
			} );

			controller.support( req, res, next );

			expect( Form ).toHaveBeenCalled();

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];

			expect( args[ 0 ] ).toEqual( req );

			expect( config.resolved ).toBeDefined();
			expect( config.resolved.type ).toEqual( Form.RADIO );
			expect( config.resolved.values ).toEqual( [ report.is_resolved ] );
			expect( config.resolved.validators[ 0 ].fn ).toEqual( boolResponse );

			expect( config.supportType ).toBeDefined();
			expect( config.supportType.type ).toEqual( Form.RADIO );
			expect( config.supportType.values ).toEqual( [ report.support_type ] );
			expect( config.supportType.conditional ).toEqual( { name: 'resolved', value: 'false' } );
			expect( config.supportType.validators[ 0 ].fn ).toEqual( supportTypeResponse );

			expect( config.stepsTaken ).toBeDefined();
			expect( config.stepsTaken.values ).toEqual( [ report.steps_taken ] );
			expect( config.stepsTaken.conditional ).toEqual( { name: 'resolved', value: 'false' } );
			expect( config.stepsTaken.required ).toBeDefined();

			expect( config.politicalSensitivities ).toBeDefined();
			expect( config.politicalSensitivities.type ).toEqual( Form.RADIO );
			expect( config.politicalSensitivities.values ).toEqual( [ report.is_politically_sensitive ] );
			expect( config.politicalSensitivities.validators[ 0 ].fn ).toEqual( boolResponse );

			expect( config.sensitivitiesDescription ).toBeDefined();
			expect( config.sensitivitiesDescription.values ).toEqual( [ report.political_sensitivity_summary ] );
			expect( config.sensitivitiesDescription.conditional ).toEqual( { name: 'politicalSensitivities', value: 'true' } );
			expect( config.sensitivitiesDescription.required ).toBeDefined();
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the view with the viewModel', async () => {

				await controller.support( req, res, next );

				expect( form.validate ).not.toHaveBeenCalled();
				expect( form.getTemplateValues ).toHaveBeenCalledWith();
				expect( res.render ).toHaveBeenCalledWith( 'reports/views/support', getTemplateValuesResponse );
			} );
		} );

		describe( 'When it is a POST', () => {

			beforeEach( () => {

				req.body = {};
				form.isPost = true;
			} );

			afterEach( () => {

				expect( form.validate ).toHaveBeenCalled();
			} );

			describe( 'When the required values are empty', () => {
				it( 'Should render the template', async () => {

					form.hasErrors = () => true;

					await controller.support( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( 'reports/views/support', getTemplateValuesResponse );
				} );
			} );

			describe( 'When the required values are filled', () => {
				describe( 'When the response is a success', () => {

					beforeEach( () => {

						backend.reports.saveSupport.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );

						req.report = { id: 1, b: 2 };
						form.hasErrors = () => false;
					} );

					afterEach( () => {

						expect( next ).not.toHaveBeenCalled();
						expect( backend.reports.saveSupport ).toHaveBeenCalledWith( req, req.report.id, getValuesResponse );
					} );

					describe( 'When save and exit is used to submit the form', () => {
						it( 'Should redirect to the report detail page', async () => {

							const reportDetailResponse = '/reportDetail';
							urls.reports.detail.and.callFake( () => reportDetailResponse );
							form.isExit = true;

							await controller.support( req, res, next );

							expect( urls.reports.detail ).toHaveBeenCalledWith( req.report.id );
							expect( res.redirect ).toHaveBeenCalledWith( reportDetailResponse );
						} );
					} );

					describe( 'When save and continue is used to submit the form', () => {
						it( 'Should redirect', async () => {

							const nextStepsResponse = '/next-steps/';
							urls.reports.nextSteps.and.callFake( () => nextStepsResponse );

							await controller.support( req, res, next );

							expect( urls.reports.nextSteps ).toHaveBeenCalledWith( req.report.id );
							expect( res.redirect ).toHaveBeenCalledWith( nextStepsResponse );
						} );
					} );
				} );

				describe( 'When the response is not a success', () => {
					it( 'Should call next with an error', async () => {

						const statusCode = 500;
						form.hasErrors = () => false;
						backend.reports.saveSupport.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

						await controller.support( req, res, next );

						expect( next ).toHaveBeenCalledWith( new Error( `Unable to save report, got ${ statusCode } from backend` ) );
					} );
				} );

				describe( 'When the request fails', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'my test' );
						form.hasErrors = () => false;
						backend.reports.saveSupport.and.callFake( () => Promise.reject( err ) );

						await controller.support( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
					} );
				} );
			} );
		} );
	} );

	describe( 'nextSteps', () => {

		let next;
		let report;

		beforeEach( () => {

			next = jasmine.createSpy( 'next' );
			report = {
				govt_response_requested: 'govt_response_requested',
				is_commercially_sensitive: 'is_commercially_sensitive',
				commercial_sensitivity_summary: 'a commercial_sensitivity_summary',
				can_publish: 'a descan_publishcription'
			};
			req.report = report;
		} );

		it( 'Should setup the form correctly', () => {

			const govResponseResponse = { govResponse: 1 };
			const boolResponse = { bool: 1 };
			const publishResponseResponse = { publishResponseResponse: 1 };

			validators.isMetadata.and.callFake( ( key ) => {

				if( key === 'govResponse' ){ return govResponseResponse; }
				if( key === 'bool' ){ return boolResponse; }
				if( key === 'publishResponse' ){ return publishResponseResponse; }
			} );

			controller.nextSteps( req, res );

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];

			expect( Form ).toHaveBeenCalled();
			expect( args[ 0 ] ).toEqual( req );

			expect( config.response ).toBeDefined();
			expect( config.response.values ).toEqual( [ report.govt_response_requested ] );
			expect( config.response.validators[ 0 ].fn ).toEqual( govResponseResponse );

			expect( config.sensitivities ).toBeDefined();
			expect( config.sensitivities.values ).toEqual( [ report.is_commercially_sensitive ] );
			expect( config.sensitivities.validators[ 0 ].fn ).toEqual( boolResponse );

			expect( config.sensitivitiesText ).toBeDefined();
			expect( config.sensitivitiesText.values ).toEqual( [ report.commercial_sensitivity_summary ] );
			expect( config.sensitivitiesText.required ).toBeDefined();

			expect( config.permission ).toBeDefined();
			expect( config.permission.values ).toEqual( [ report.can_publish ] );
			expect( config.permission.validators[ 0 ].fn ).toEqual( publishResponseResponse );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the view with the viewModel', async () => {

				await controller.nextSteps( req, res, next );

				expect( form.validate ).not.toHaveBeenCalled();
				expect( form.getTemplateValues ).toHaveBeenCalledWith();
				expect( res.render ).toHaveBeenCalledWith( 'reports/views/next-steps', getTemplateValuesResponse );
			} );
		} );

		describe( 'When it is a POST', () => {

			beforeEach( () => {

				req.body = {};
				form.isPost = true;
			} );

			afterEach( () => {

				expect( form.validate ).toHaveBeenCalled();
			} );

			describe( 'When the required values are empty', () => {
				it( 'Should render the template', async () => {

					form.hasErrors = () => true;

					await controller.nextSteps( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( 'reports/views/next-steps', getTemplateValuesResponse );
				} );
			} );

			describe( 'When the required values are filled', () => {

				let reportDetailResponse;
				describe( 'When the response is a success', () => {

					beforeEach( () => {

						reportDetailResponse = '/reportDetail';
						urls.reports.detail.and.callFake( () => reportDetailResponse );
						backend.reports.saveNextSteps.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );

						req.report = { id: 1, b: 2 };
						form.hasErrors = () => false;
					} );

					afterEach( () => {

						expect( next ).not.toHaveBeenCalled();
						expect( backend.reports.saveNextSteps ).toHaveBeenCalledWith( req, req.report.id, getValuesResponse );
					} );

					describe( 'When save and exit is used to submit the form', () => {
						it( 'Should redirect to the report detail page', async () => {

							form.isExit = true;

							await controller.nextSteps( req, res, next );

							expect( urls.reports.detail ).toHaveBeenCalledWith( req.report.id );
							expect( res.redirect ).toHaveBeenCalledWith( reportDetailResponse );
						} );
					} );

					describe( 'When save and continue is used to submit the form', () => {
						it( 'Should redirect', async () => {

							await controller.nextSteps( req, res, next );

							expect( urls.reports.detail ).toHaveBeenCalledWith( req.report.id );
							expect( res.redirect ).toHaveBeenCalledWith( reportDetailResponse );
						} );
					} );
				} );

				describe( 'When the response is not a success', () => {
					it( 'Should call next with an error', async () => {

						const statusCode = 500;
						form.hasErrors = () => false;
						backend.reports.saveNextSteps.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

						await controller.nextSteps( req, res, next );

						expect( next ).toHaveBeenCalledWith( new Error( `Unable to save report, got ${ statusCode } from backend` ) );
					} );
				} );

				describe( 'When the request fails', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'my test' );
						form.hasErrors = () => false;
						backend.reports.saveNextSteps.and.callFake( () => Promise.reject( err ) );

						await controller.nextSteps( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
					} );
				} );
			} );
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

			it( 'Should render the submitted page', async () => {

				const successUrlResponse = '/a-url';

				urls.reports.success.and.callFake( () => successUrlResponse );

				await controller.submit( req, res, next );

				expect( res.redirect ).toHaveBeenCalledWith( successUrlResponse );
			} );
		} );

		describe( 'When the response is not a success', () => {
			it( 'Should call next with an error', async () => {

				const statusCode = 500;
				const reportDetailResponse = '/reportDetail';
				urls.reports.detail.and.callFake( () => reportDetailResponse );
				form.hasErrors = () => false;
				backend.reports.submit.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

				await controller.submit( req, res, next );

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

	describe( 'success', () => {
		it( 'Should render the success page', () => {

			controller.success( req, res );

			expect( res.render ).toHaveBeenCalledWith( 'reports/views/success' );
		} );
	} );
} );
