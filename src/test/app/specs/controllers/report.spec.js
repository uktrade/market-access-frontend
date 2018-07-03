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
	let csrfToken;
	let metadata;
	let Form;
	let form;
	let getValuesResponse;
	let getTemplateValuesResponse;
	let validators;
	let reportDetailViewModel;

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
			]
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
		backend = {
			saveNewReport: jasmine.createSpy( 'backend.saveNewReport' ),
			updateReport: jasmine.createSpy( 'backend.updateReport' ),
			saveProblem: jasmine.createSpy( 'backend.saveProblem' ),
			saveNextSteps: jasmine.createSpy( 'backend.saveNextSteps' )
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
				aboutProblem: jasmine.createSpy( 'urls.report.aboutProblem' ),
				nextSteps: jasmine.createSpy( 'urls.report.nextSteps' ),
				detail: jasmine.createSpy( 'urls.report.detail' )
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

		validators = {
			isMetadata: jasmine.createSpy( 'validators.isMetaData' ),
			isCountry: jasmine.createSpy( 'validators.isCountry' )
		};

		controller = proxyquire( modulePath, {
			'../lib/backend-service': backend,
			'../lib/datahub-service': datahub,
			'../lib/urls': urls,
			'../lib/metadata': metadata,
			'../lib/Form': Form,
			'../lib/validators': validators,
			'../lib/view-models/report/detail': reportDetailViewModel
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
		it( 'Should render the reports page', () => {

			controller.index( req, res );

			expect( res.render ).toHaveBeenCalledWith( 'report/index', { tasks: metadata.reportTaskList } );
		} );
	} );

	describe( 'Report', () => {
		it( 'Should render the report detail page', () => {

			const reportDetailViewModelResponse = { a: 1, b: 2 };
			req.report = { c: 3, d: 4 };

			reportDetailViewModel.and.callFake( () => reportDetailViewModelResponse );

			controller.report( req, res );

			expect( reportDetailViewModel ).toHaveBeenCalledWith( req.report );
			expect( res.render ).toHaveBeenCalledWith( 'report/detail', reportDetailViewModelResponse );
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

					urls.report.companySearch.and.callFake( () => companyUrl );

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
				expect( res.render ).toHaveBeenCalledWith( 'report/start', getTemplateValuesResponse );
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
				req.session.startFormValues = { status: 1 };
				req.session.reportContact = contactId;
				req.session.reportCompany = { id: 1 };
			} );

			function checkSession(){

				expect( req.session.startFormValues ).not.toBeDefined();
				expect( req.session.reportContact ).not.toBeDefined();
				expect( req.session.reportCompany ).not.toBeDefined();
			}

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

						afterEach( () => checkSession() );

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

							let responseBody;

							beforeEach( () => {

								responseBody = { id: 1, name: 2 };
								backend.saveNewReport.and.callFake( () => Promise.resolve( {
									response: { isSuccess: true },
									body: responseBody
								} ) );

							} );

							describe( 'When the action is exit', () => {

								it( 'Should put the body in the session and redirect', async () => {

									const detailUrl = '/b-test';
									req.body.action = 'exit';

									urls.report.detail.and.callFake( () => detailUrl );

									await controller.save( req, res, next );

									//expect( req.session.report ).toEqual( responseBody );
									expect( res.redirect ).toHaveBeenCalledWith( detailUrl );
									expect( urls.report.detail ).toHaveBeenCalledWith( responseBody.id );
								} );
							} );
							describe( 'When the action is NOT exit', () => {

								it( 'Should put the body in the session and redirect', async () => {

									const aboutProblemUrl = '/a-test';

									urls.report.aboutProblem.and.callFake( () => aboutProblemUrl );

									await controller.save( req, res, next );

									//expect( req.session.report ).toEqual( responseBody );
									expect( res.redirect ).toHaveBeenCalledWith( aboutProblemUrl );
									expect( urls.report.aboutProblem ).toHaveBeenCalledWith( responseBody.id );
								} );
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

						delete req.session.startFormValues;
						delete req.session.reportCompany;

						req.report = {
							problem_status: 1,
							is_emergency: 2,
							company_id: 3,
							company_name: 'fred'
						};

						await controller.save( req, res, next );

						expect( backend.updateReport ).toHaveBeenCalled();

						const args = backend.updateReport.calls.argsFor( 0 );
						expect( args[ 0 ] ).toEqual( req );
						expect( args[ 1 ] ).toEqual( reportId );
						expect( args[ 2 ] ).toEqual( { status: req.report.problem_status, emergency: ( req.report.is_emergency + '' ) } );
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

		let next;
		let report;

		beforeEach( () => {

			next = jasmine.createSpy( 'next' );
			report = {
				product: 'myProduct',
				commodity_codes: [ 'code 1', 'code 2' ],
				export_country: 'a country',
				problem_description: 'a description',
				problem_impact: 'problem_impact',
				estimated_loss_range: 'a range',
				other_companies_affected: 'a company'
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
			expect( config.commodityCode.values ).toEqual( [ report.commodity_codes.join( ', ' ) ] );

			expect( config.country ).toBeDefined();
			expect( config.country.values ).toEqual( [ report.export_country ] );
			expect( config.country.validators[ 0 ].fn ).toEqual( validators.isCountry );

			expect( config.description ).toBeDefined();
			expect( config.description.values ).toEqual( [ report.problem_description ] );
			expect( config.description.required ).toBeDefined();

			expect( config.impact ).toBeDefined();
			expect( config.impact.values ).toEqual( [ report.problem_impact ] );
			expect( config.impact.required ).toBeDefined();

			expect( config.losses ).toBeDefined();
			expect( config.losses.values ).toEqual( [ report.estimated_loss_range ] );
			expect( config.losses.validators[ 0 ].fn ).toEqual( lossScaleResponse );

			expect( config.otherCompanies ).toBeDefined();
			expect( config.otherCompanies.values ).toEqual( [ report.other_companies_affected ] );
			expect( config.otherCompanies.validators[ 0 ].fn ).toEqual( boolScaleResponse );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the view with the viewModel', async () => {

				await controller.aboutProblem( req, res, next );

				expect( form.validate ).not.toHaveBeenCalled();
				expect( form.getTemplateValues ).toHaveBeenCalledWith();
				expect( res.render ).toHaveBeenCalledWith( 'report/about-problem', getTemplateValuesResponse );
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

					expect( res.render ).toHaveBeenCalledWith( 'report/about-problem', getTemplateValuesResponse );
				} );
			} );

			describe( 'When the required values are filled', () => {
				describe( 'When the response is a success', () => {

					beforeEach( () => {

						backend.saveProblem.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );

						req.report = { id: 1, b: 2 };
						form.hasErrors = () => false;
					} );

					afterEach( () => {

						expect( next ).not.toHaveBeenCalled();
						expect( backend.saveProblem ).toHaveBeenCalledWith( req, req.report.id, getValuesResponse );
					} );

					describe( 'When save and exit is used to submit the form', () => {
						it( 'Should redirect to the report detail page', async () => {

							const reportDetailResponse = '/reportDetail';
							urls.report.detail.and.callFake( () => reportDetailResponse );
							form.isExit = true;

							await controller.aboutProblem( req, res, next );

							expect( urls.report.detail ).toHaveBeenCalledWith( req.report.id );
							expect( res.redirect ).toHaveBeenCalledWith( reportDetailResponse );
						} );
					} );

					describe( 'When save and continue is used to submit the form', () => {
						it( 'Should redirect', async () => {

							const nextStepsUrlResponse = '/next/';
							urls.report.nextSteps.and.callFake( () => nextStepsUrlResponse );

							await controller.aboutProblem( req, res, next );

							expect( urls.report.nextSteps ).toHaveBeenCalledWith( req.report.id );
							expect( res.redirect ).toHaveBeenCalledWith( nextStepsUrlResponse );
						} );
					} );
				} );

				describe( 'When the response is not a success', () => {
					it( 'Should call next with an error', async () => {

						const statusCode = 500;
						form.hasErrors = () => false;
						backend.saveProblem.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

						await controller.aboutProblem( req, res, next );

						expect( next ).toHaveBeenCalledWith( new Error( `Unable to save report, got ${ statusCode } from backend` ) );
					} );
				} );

				describe( 'When the request fails', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'my test' );
						form.hasErrors = () => false;
						backend.saveProblem.and.callFake( () => Promise.reject( err ) );

						await controller.aboutProblem( req, res, next );

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
				govt_response_requester: 'govt_response_requester',
				is_confidential: 'is_confidential',
				sensitivity_summary: 'a sensitivity_summary',
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
			expect( config.response.values ).toEqual( [ report.govt_response_requester ] );
			expect( config.response.validators[ 0 ].fn ).toEqual( govResponseResponse );

			expect( config.sensitivities ).toBeDefined();
			expect( config.sensitivities.values ).toEqual( [ report.is_confidential ] );
			expect( config.sensitivities.validators[ 0 ].fn ).toEqual( boolResponse );

			expect( config.sensitivitiesText ).toBeDefined();
			expect( config.sensitivitiesText.values ).toEqual( [ report.sensitivity_summary ] );
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
				expect( res.render ).toHaveBeenCalledWith( 'report/next-steps', getTemplateValuesResponse );
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

					expect( res.render ).toHaveBeenCalledWith( 'report/next-steps', getTemplateValuesResponse );
				} );
			} );

			describe( 'When the required values are filled', () => {
				describe( 'When the response is a success', () => {

					beforeEach( () => {

						backend.saveNextSteps.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );

						req.report = { id: 1, b: 2 };
						form.hasErrors = () => false;
					} );

					afterEach( () => {

						expect( next ).not.toHaveBeenCalled();
						expect( backend.saveNextSteps ).toHaveBeenCalledWith( req, req.report.id, getValuesResponse );
					} );

					describe( 'When save and exit is used to submit the form', () => {
						it( 'Should redirect to the report detail page', async () => {

							const reportDetailResponse = '/reportDetail';
							urls.report.detail.and.callFake( () => reportDetailResponse );
							form.isExit = true;

							await controller.nextSteps( req, res, next );

							expect( urls.report.detail ).toHaveBeenCalledWith( req.report.id );
							expect( res.redirect ).toHaveBeenCalledWith( reportDetailResponse );
						} );
					} );

					describe( 'When save and continue is used to submit the form', () => {
						it( 'Should redirect', async () => {

							const indexResponse = '/next/';
							urls.index.and.callFake( () => indexResponse );

							await controller.nextSteps( req, res, next );

							expect( urls.index ).toHaveBeenCalledWith();
							expect( res.redirect ).toHaveBeenCalledWith( indexResponse );
						} );
					} );
				} );

				describe( 'When the response is not a success', () => {
					it( 'Should call next with an error', async () => {

						const statusCode = 500;
						form.hasErrors = () => false;
						backend.saveNextSteps.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

						await controller.nextSteps( req, res, next );

						expect( next ).toHaveBeenCalledWith( new Error( `Unable to save report, got ${ statusCode } from backend` ) );
					} );
				} );

				describe( 'When the request fails', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'my test' );
						form.hasErrors = () => false;
						backend.saveNextSteps.and.callFake( () => Promise.reject( err ) );

						await controller.nextSteps( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
					} );
				} );
			} );
		} );
	} );
} );
