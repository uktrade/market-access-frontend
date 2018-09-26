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
	let govukItemsFromObj;
	let govukItemsFromObjResponse;

	beforeEach( () => {

		csrfToken = uuid();
		govukItemsFromObjResponse = [ { items: 1 } ];
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
			countryList: [
				{ id: 0, name: 'Choose one' },
				{ id: 1, name: 'country 1' },
				{ id: 2, name: 'country 2' }
			],
			barrierAwareness: {
				'A': 'a',
				'B': 'b'
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
		govukItemsFromObj = jasmine.createSpy( 'govukItemsFromObj' ).and.callFake( () => govukItemsFromObjResponse );
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
				isResolved: jasmine.createSpy( 'urls.reports.isResolved' ),
				country: jasmine.createSpy( 'urls.reports.country' ),
				aboutProblem: jasmine.createSpy( 'urls.reports.aboutProblem' ),
				sectors: jasmine.createSpy( 'urls.reports.sectors' ),
				hasSectors: jasmine.createSpy( 'urls.reports.hasSectors' ),
				detail: jasmine.createSpy( 'urls.reports.detail' ),
				success: jasmine.createSpy( 'urls.reports.success' )
			}
		};

		getValuesResponse = { a: 1, b: 2 };
		getTemplateValuesResponse = { c: 3, d: 4 };
		form = {
			hasErrors: jasmine.createSpy( 'form.hasErrors' ),
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
			isBarrierType: jasmine.createSpy( 'validators.isBarrierType' ),
			isDateValue: jasmine.createSpy( 'validators.isDateValue' ),
			isDateValid: jasmine.createSpy( 'validators.isDateValid' ),
			isDateInPast: jasmine.createSpy( 'validators.isDateInPast' )
		};

		controller = proxyquire( modulePath, {
			'../../lib/backend-service': backend,
			'../../lib/datahub-service': datahub,
			'../../lib/urls': urls,
			'../../lib/metadata': metadata,
			'../../lib/Form': Form,
			'../../lib/validators': validators,
			'./view-models/detail': reportDetailViewModel,
			'./view-models/reports': reportsViewModel,
			'../../lib/govuk-items-from-object': govukItemsFromObj
		} );
	} );

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
					backend.reports.getAll.and.callFake( () => Promise.resolve( unfinishedReportsResponse ) );

					await controller.index( req, res, next );

					expect( next ).not.toHaveBeenCalled();
					expect( backend.reports.getAll ).toHaveBeenCalledWith( req );
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
				problem_status: 'report status'
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

			expect( config.emergency ).not.toBeDefined();
		} );

		describe( 'When it is a POST', () => {

			beforeEach( () => {

				req.method = 'POST';
				req.body = {};
				form.isPost = true;
			} );

			describe( 'When the input values are valid', () => {

				it( 'Should save the values and redirect to the next step', () => {

					const isResolvedUrl = 'my-url';
					const status = '123';

					req.body = { status };
					form.hasErrors = () => false;

					urls.reports.isResolved.and.callFake( () => isResolvedUrl );

					controller.start( req, res );

					expect( form.validate ).toHaveBeenCalled();
					expect( req.session.startFormValues ).toEqual( getValuesResponse );
					expect( urls.reports.isResolved ).toHaveBeenCalledWith( undefined );
					expect( res.redirect ).toHaveBeenCalledWith( isResolvedUrl );
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

				const sessionValues = { status: 1 };

				req.session.startFormValues = sessionValues;
				req.report = { id: 1, test: 2 };

				controller.start( req, res );

				expect( form.getTemplateValues ).toHaveBeenCalledWith();
				expect( res.render ).toHaveBeenCalledWith( 'reports/views/start', getTemplateValuesResponse );
			} );
		} );
	} );

	describe( 'isResolved', () => {

		const template = 'reports/views/is-resolved';

		it( 'Should setup the form correctly', () => {

			const monthResponse = { month: true };
			const yearResponse = { year: true };
			const boolResponse = { bool: true };
			const sessionValues = {
				isResolved: 'isResolved'
			};
			const report = {
				is_resolved: 'is_resolved',
				resolved_date: '2018-02-01'
			};

			req.report = report;
			req.session.isResolvedFormValues = sessionValues;

			validators.isMetadata.and.callFake( ( key ) => {

				if( key === 'bool' ){ return boolResponse; }
			} );

			validators.isDateValue.and.callFake( ( key ) => {

				if( key === 'month' ){ return monthResponse; }
				if( key === 'year' ){ return yearResponse; }
			} );

			controller.isResolved( req, res );

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];

			expect( Form ).toHaveBeenCalled();
			expect( args[ 0 ] ).toEqual( req );

			expect( config.isResolved ).toBeDefined();
			expect( config.isResolved.type ).toEqual( Form.RADIO );
			expect( config.isResolved.values ).toEqual( [ sessionValues.isResolved, report.is_resolved ] );
			expect( config.isResolved.items ).toEqual( govukItemsFromObjResponse );
			expect( govukItemsFromObj ).toHaveBeenCalledWith( metadata.bool );
			expect( config.isResolved.validators.length ).toEqual( 1 );
			expect( config.isResolved.validators[ 0 ].fn ).toEqual( boolResponse );

			expect( config.resolvedDate ).toBeDefined();
			expect( config.resolvedDate.type ).toEqual( Form.GROUP );
			expect( config.resolvedDate.conditional ).toEqual( { name: 'isResolved', value: 'true' } );
			expect( config.resolvedDate.errorField ).toEqual( 'resolved_date' );
			expect( config.resolvedDate.validators.length ).toEqual( 4 );
			expect( config.resolvedDate.validators[ 0 ].fn ).toEqual( monthResponse );
			expect( config.resolvedDate.validators[ 1 ].fn ).toEqual( yearResponse );
			expect( config.resolvedDate.validators[ 2 ].fn ).toEqual( validators.isDateValid );
			expect( config.resolvedDate.validators[ 3 ].fn ).toEqual( validators.isDateInPast );
			expect( config.resolvedDate.items ).toEqual( {
				month: {
					values: [ '02' ]
				},
				year: {
					values: [ '2018' ]
				}
			} );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the template', () => {

				controller.isResolved( req, res );

				expect( res.render ).toHaveBeenCalledWith( template, getTemplateValuesResponse );
				expect( form.hasErrors ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'When it is a POST', () => {

			beforeEach( () => {

				form.isPost = true;
			} );

			describe( 'When the form is valid', () => {
				it( 'Should save the values to the session and redirect to the correct url', () => {

					const countryUrlResponse = '/a/country/url';

					urls.reports.country.and.callFake( () => countryUrlResponse );

					controller.isResolved( req, res );

					expect( form.validate ).toHaveBeenCalledWith();
					expect( form.hasErrors ).toHaveBeenCalledWith();
					expect( req.session.isResolvedFormValues ).toEqual( getValuesResponse );
					expect( res.redirect ).toHaveBeenCalledWith( countryUrlResponse );
					expect( res.render ).not.toHaveBeenCalled();
				} );
			} );

			describe( 'When the form is not valid', () => {
				it( 'Should save the values to the session and redirect to the correct url', () => {

					form.hasErrors.and.callFake( () => true );

					controller.isResolved( req, res );

					expect( form.validate ).toHaveBeenCalledWith();
					expect( form.hasErrors ).toHaveBeenCalledWith();
					expect( typeof req.session.isResolvedFormValues ).toEqual( 'undefined' );
					expect( res.redirect ).not.toHaveBeenCalled();
					expect( res.render ).toHaveBeenCalledWith( template, getTemplateValuesResponse );
				} );
			} );
		} );
	} );

	describe( 'country', () => {

		const template = 'reports/views/country';

		it( 'Should setup the form correctly', async () => {

			const report = {
				export_country: [ 'a country' ]
			};

			req.report = report;

			await controller.country( req, res, next );

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];

			expect( Form ).toHaveBeenCalled();
			expect( args[ 0 ] ).toEqual( req );

			expect( config.country ).toBeDefined();
			expect( config.country.type ).toEqual( Form.SELECT );
			expect( config.country.values ).toEqual( [ report.export_country ] );
			expect( config.country.items ).toEqual( metadata.countryList );
			expect( config.country.validators.length ).toEqual( 1 );
			expect( config.country.validators[ 0 ].fn ).toEqual( validators.isCountry );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the correct template', async () => {

				await controller.country( req, res, next );

				expect( res.render ).toHaveBeenCalledWith( template, getTemplateValuesResponse );
			} );
		} );

		describe( 'When it is a POST', () => {

			let sessionValues;

			beforeEach( () => {

				form.isPost = true;
			} );

			describe( 'When the form has errors', () => {
				it( 'Should render the template', async () => {

					sessionValues = {
						startFormValues: { a: 1 },
						isResolvedFormValues: { b: 2 }
					};

					req.session = sessionValues;

					form.hasErrors.and.callFake( () => true );

					await controller.country( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( template, getTemplateValuesResponse );
					expect( req.session ).toEqual( sessionValues );
				} );
			} );

			describe( 'When the form does not have errors', () => {
				describe( 'When there is a report and no session data', () => {

					let report;
					let saveValues;

					beforeEach( () => {

						report = {
							id: 1,
							problem_status: { a: 1 },
							is_resolved: { b: 2 },
							resolved_date: { c: 3 }
						};

						saveValues = Object.assign( {}, {
							status: report.problem_status,
							isResolved: report.is_resolved,
							resolvedDate: report.resolved_date
						}, getValuesResponse );

						req.report = report;
					} );

					it( 'Should update the report with the report data', async () => {

						await controller.country( req, res, next );

						const args = backend.reports.update.calls.argsFor( 0 );

						expect( args[ 0 ] ).toEqual( req );
						expect( args[ 1 ] ).toEqual( report.id );
						expect( args[ 2 ] ).toEqual( saveValues );
					} );

					describe( 'When the update throws an error', () => {
						it( 'Should call next with the error', async () => {

							const err = new Error( 'an update error' );

							backend.reports.update.and.callFake( () => Promise.reject( err ) );

							await controller.country( req, res, next );

							expect( next ).toHaveBeenCalledWith( err );
							expect( res.redirect ).not.toHaveBeenCalled();
						} );
					} );

					describe( 'When the update does not throw an error', () => {
						describe( 'When the response is a success', () => {
							it( 'Should redirect to the correct url', async () => {

								const hasSectorsResponse = '/a/sector/url';
								const body = { id: 2 };

								backend.reports.update.and.callFake( () => Promise.resolve( { response: { isSuccess: true }, body } ) );
								urls.reports.hasSectors.and.callFake( () => hasSectorsResponse );

								await controller.country( req, res, next );

								expect( res.redirect ).toHaveBeenCalledWith( hasSectorsResponse );
								expect( urls.reports.hasSectors ).toHaveBeenCalledWith( body.id );
								expect( next ).not.toHaveBeenCalled();
							} );
						} );
					} );
				} );

				describe( 'When there is only session data', () => {

					beforeEach( () => {

						sessionValues = {
							startFormValues: { x: 1 },
							isResolvedFormValues: { y: 2 }
						};

						req.session = sessionValues;
					} );

					describe( 'When the response is a success', () => {

						const response = { isSuccess: true };

						it( 'Should delete the session data', async () => {

							backend.reports.save.and.callFake( () => Promise.resolve( { response } ) );

							await controller.country( req, res, next );

							expect( req.session ).toEqual( {} );
						} );

						describe( 'When there is not a body with an id', () => {
							it( 'Should call next with an error', async () => {

								backend.reports.save.and.callFake( () => Promise.resolve( { response, body: {} } ) );

								await controller.country( req, res, next );

								expect( next ).toHaveBeenCalledWith( new Error( 'No id created for report' ) );
							} );
						} );

						describe( 'When there is a body with id', () => {
							it( 'Should redirect to the correct url', async () => {

								const hasSectorsResponse = '/a/b/c';

								urls.reports.hasSectors.and.callFake( () => hasSectorsResponse );
								backend.reports.save.and.callFake( () => Promise.resolve( { response, body: { id: 10 } } ) );

								await controller.country( req, res, next );

								expect( res.redirect ).toHaveBeenCalledWith( hasSectorsResponse  );
								expect( urls.reports.hasSectors ).toHaveBeenCalledWith( 10 );
							} );
						} );
					} );

					describe( 'When the response is not a success', () => {
						it( 'Should call next with an error', async () => {

							backend.reports.save.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode: 123 } } ) );

							await controller.country( req, res, next );

							expect( next ).toHaveBeenCalledWith( new Error( 'Unable to save report, got 123 response code' ) );
						} );
					} );
				} );
			} );
		} );
	} );

	describe( 'aboutProblem', () => {

		let report;

		beforeEach( () => {

			report = {
				product: 'myProduct',
				problem_description: 'a description',
				barrier_title: 'barrier_title',
				source: 'barrier_awareness',
				other_source: 'barrier_awareness_other',
				resolution_summary: 'resolution_summary'
			};
			req.report = report;
		} );

		describe( 'Form config', () => {

			let barrierAwarenessResponse;

			function checkForm( args, isResolved ){

				const config = args[ 1 ];

				expect( Form ).toHaveBeenCalled();
				expect( args[ 0 ] ).toEqual( req );

				expect( config.item ).toBeDefined();
				expect( config.item.required ).toBeDefined();
				expect( config.item.values ).toEqual( [ report.product ] );

				expect( config.country ).not.toBeDefined();

				expect( config.description ).toBeDefined();
				expect( config.description.values ).toEqual( [ report.problem_description ] );
				expect( config.description.required ).toBeDefined();

				expect( config.barrierTitle ).toBeDefined();
				expect( config.barrierTitle.values ).toEqual( [ report.barrier_title ] );
				expect( config.barrierTitle.required ).toBeDefined();

				expect( config.barrierAwareness ).toBeDefined();
				expect( config.barrierAwareness.type ).toEqual( Form.RADIO );
				expect( config.barrierAwareness.values ).toEqual( [ report.source ] );
				expect( config.barrierAwareness.validators[ 0 ].fn ).toEqual( barrierAwarenessResponse );
				expect( Array.isArray( config.barrierAwareness.items ) ).toEqual( true );

				expect( config.barrierAwarenessOther ).toBeDefined();
				expect( config.barrierAwarenessOther.conditional ).toEqual( { name: 'barrierAwareness', value: 'OTHER' } );
				expect( config.barrierAwarenessOther.values ).toEqual( [ report.other_source ] );

				if( isResolved ){

					expect( config.resolvedDescription ).toBeDefined();
					expect( config.resolvedDescription.values ).toEqual( [ report.status_summary ] );
					expect( config.resolvedDescription.required ).toBeDefined();
				}
			}

			beforeEach( () => {

				barrierAwarenessResponse = { barrierAwarenessResponse: true };

				validators.isMetadata.and.callFake( ( key ) => {

					if( key === 'barrierAwareness' ){ return barrierAwarenessResponse; }
				} );
			} );

			describe( 'When the report is resolved', () => {
				it( 'Should setup the form correctly', async () => {

					req.report.is_resolved = true;

					await controller.aboutProblem( req, res, next );

					checkForm( Form.calls.argsFor( 0 ), true );
				} );
			} );

			describe( 'When the report is NOT resolved', () => {
				it( 'Should setup the form correctly', async () => {

					await controller.aboutProblem( req, res, next );

					checkForm( Form.calls.argsFor( 0 ) );
				} );
			} );
		} );

		describe( 'FormProcessor', () => {

			let FormProcessor;
			let processFn;
			let args;

			beforeEach( async () => {

				FormProcessor = jasmine.createSpy( 'FormProcessor' );
				processFn = jasmine.createSpy( 'FormProcessor.process' );

				controller = proxyquire( modulePath, {
					'../../lib/backend-service': backend,
					'../../lib/urls': urls,
					'../../lib/metadata': metadata,
					'../../lib/Form': Form,
					'../../lib/FormProcessor': FormProcessor,
					'../../lib/validators': validators
				} );

				FormProcessor.and.callFake( () => ({
					process: processFn
				}) );

				req.report.is_resolved = true;

				await controller.aboutProblem( req, res, next );

				args = FormProcessor.calls.argsFor( 0 )[ 0 ];
			} );

			it( 'Should setup the FormProcessor correctly', () => {

				expect( args.form ).toEqual( form );
				expect( typeof args.render ).toEqual( 'function' );
				expect( typeof args.saveFormData ).toEqual( 'function' );
				expect( typeof args.saved ).toEqual( 'function' );
			} );

			describe( 'render', () => {

				const template = 'reports/views/about-problem';

				describe( 'When the report has sectors_affected', () => {
					it( 'Should render the template with the correct data', () => {

						const myValues = { some: 'data' };
						const sectorsResponse = 'sectors';
						const renderValues = Object.assign( {}, myValues, { backHref: sectorsResponse, isResolved: true } );

						urls.reports.sectors.and.callFake( () => sectorsResponse );
						report.sectors_affected = true;

						args.render( myValues );

						expect( res.render ).toHaveBeenCalledWith( template, renderValues );
					} );
				} );

				describe( 'When the report does not have sectors_affected', () => {
					it( 'Should render the template with the correct data', () => {

						const myValues = { some: 'data' };
						const hasSectorsResponse = 'hasSectors';
						const renderValues = Object.assign( {}, myValues, { backHref: hasSectorsResponse, isResolved: true } );

						urls.reports.hasSectors.and.callFake( () => hasSectorsResponse );

						args.render( myValues );

						expect( res.render ).toHaveBeenCalledWith( template, renderValues );
					} );
				} );
			} );

			describe( 'safeFormData', () => {
				it( 'Should call the correct method with the correct data', () => {

					const myFormData = { a: true, b: false };

					args.saveFormData( myFormData );

					expect( backend.reports.saveProblem ).toHaveBeenCalledWith( req, report.id, myFormData );
				} );
			} );

			describe( 'Saved', () => {
				it( 'Should redirect to the correct URL', () => {

					const detailResponse = '/a/path/detail';

					urls.reports.detail.and.callFake( () => detailResponse );

					args.saved();

					expect( urls.reports.detail ).toHaveBeenCalledWith( report.id  );
					expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
				} );
			} );

			describe( 'Calling formProcessor.process', () => {
				describe( 'When there are no errors', () => {
					it( 'Should not call next', async () => {

						await controller.aboutProblem( req, res, next );

						expect( next ).not.toHaveBeenCalledWith();
					} );
				} );

				describe( 'When the formProcessor throws an error', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'Some random error' );

						processFn.and.callFake( () => Promise.reject( err ) );

						await controller.aboutProblem( req, res, next );

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

			const id = uuid();

			req.uuid = id;

			controller.success( req, res );

			expect( res.render ).toHaveBeenCalledWith( 'reports/views/success', { uuid: id } );
		} );
	} );
} );
