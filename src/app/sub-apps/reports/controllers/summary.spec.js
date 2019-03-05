const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

const modulePath = './summary';

describe( 'Report controllers', () => {

	let controller;
	let req;
	let res;
	let next;
	let Form;
	let form;
	let urls;
	let config;
	let backend;
	let getValuesResponse;
	let getTemplateValuesResponse;

	beforeEach( () => {

		( { req, res, next } = jasmine.helpers.mocks.middleware() );

		getValuesResponse = { a: 1, b: 2 };
		getTemplateValuesResponse = { c: 3, d: 4 };
		form = {
			hasErrors: jasmine.createSpy( 'form.hasErrors' ),
			validate: jasmine.createSpy( 'form.validate' ),
			getValues: jasmine.createSpy( 'form.getValues' ).and.callFake( () => getValuesResponse ),
			getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.callFake( () => getTemplateValuesResponse )
		};

		urls = {
			reports: {
				detail: jasmine.createSpy( 'urls.reports.detail' ),
				aboutProblem: jasmine.createSpy( 'urls.reports.aboutProblem' ),
			},
			barriers: {
				detail: jasmine.createSpy( 'urls.barriers.detail' ),
			},
		};

		backend = {
			reports: {
				saveSummary: jasmine.createSpy( 'backend.reports.saveSummary' ),
				saveSummaryAndSubmit: jasmine.createSpy( 'backend.reports.saveSummaryAndSubmit' ),
			}
		};

		config = {
			reports: {
				summaryLimit: 400,
			}
		};

		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );

		controller = proxyquire( modulePath, {
			'../../../lib/backend-service': backend,
			'../../../lib/Form': Form,
			'../../../lib/urls': urls,
			'../../../config': config,
		} );
	} );

	describe( 'summary', () => {

		let report;

		beforeEach( () => {

			report = {
				id: uuid(),
				problem_description: 'a description',
				resolution_summary: 'resolution_summary',
				next_steps_summary: 'next_steps_summary',
			};
			req.report = report;
		} );

		describe( 'Form config', () => {

			function checkForm( args, isResolved ){

				const config = args[ 1 ];

				expect( Form ).toHaveBeenCalled();
				expect( args[ 0 ] ).toEqual( req );

				expect( config.description ).toBeDefined();
				expect( config.description.values ).toEqual( [ report.problem_description ] );
				expect( config.description.required ).toBeDefined();

				if( isResolved ){

					expect( config.resolvedDescription ).toBeDefined();
					expect( config.resolvedDescription.values ).toEqual( [ report.status_summary ] );
					expect( config.resolvedDescription.required ).toBeDefined();

				} else {

					expect( config.nextSteps ).toBeDefined();
					expect( config.nextSteps.values ).toEqual( [ report.next_steps_summary ] );
				}
			}

			describe( 'When the report is resolved', () => {
				it( 'Should setup the form correctly', async () => {

					req.report.is_resolved = true;

					await controller( req, res, next );

					checkForm( Form.calls.argsFor( 0 ), true );
				} );
			} );

			describe( 'When the report is NOT resolved', () => {
				it( 'Should setup the form correctly', async () => {

					req.report.next_steps_summary = 'my next steps';

					await controller( req, res, next );

					checkForm( Form.calls.argsFor( 0 ) );
				} );
			} );
		} );

		describe( 'FormProcessor', () => {

			const template = 'reports/views/summary';

			let FormProcessor;
			let processFn;
			let args;

			beforeEach( async () => {

				FormProcessor = jasmine.createSpy( 'FormProcessor' );
				processFn = jasmine.createSpy( 'FormProcessor.process' );

				controller = proxyquire( modulePath, {
					'../../../lib/backend-service': backend,
					'../../../lib/urls': urls,
					'../../../config': config,
					'../../../lib/Form': Form,
					'../../../lib/FormProcessor': FormProcessor,
				} );

				FormProcessor.and.callFake( () => ({
					process: processFn
				}) );

				req.report.is_resolved = true;

				await controller( req, res, next );

				args = FormProcessor.calls.argsFor( 0 )[ 0 ];
			} );

			it( 'Should setup the FormProcessor correctly', () => {

				expect( args.form ).toEqual( form );
				expect( typeof args.render ).toEqual( 'function' );
				expect( typeof args.saveFormData ).toEqual( 'function' );
				expect( typeof args.saved ).toEqual( 'function' );
			} );

			describe( 'render', () => {
				it( 'Should render the template with the correct data', () => {

					const myValues = { some: 'data' };
					const aboutProblemResponse = 'hasSectors';
					const renderValues = Object.assign( {},
						myValues,{
							backHref: aboutProblemResponse,
							isResolved: true,
							summaryLimit: config.reports.summaryLimit,
						}
					);

					urls.reports.aboutProblem.and.callFake( () => aboutProblemResponse );

					args.render( myValues );

					expect( res.render ).toHaveBeenCalledWith( template, renderValues );
				} );
			} );

			describe( 'saveFormData', () => {
				describe( 'When it is Save and exit', () => {
					it( 'Should call the correct method with the correct data', () => {

						const myFormData = { a: true, b: false };

						form.isExit = true;

						args.saveFormData( myFormData );

						expect( backend.reports.saveSummary ).toHaveBeenCalledWith( req, report.id, myFormData );
					} );
				} );

				describe( 'When it is Save and continue', () => {
					it( 'Should call the correct method with the correct data', () => {

						const myFormData = { a: true, b: false };

						args.saveFormData( myFormData );

						expect( backend.reports.saveSummaryAndSubmit ).toHaveBeenCalledWith( req, report.id, myFormData );
					} );
				} );
			} );

			describe( 'Saved', () => {
				describe( 'When it is Save and exit', () => {
					it( 'Should redirect to the report detail page', () => {

						const detailUrlResponse = '/detail-url';
						const body = { id: 123 };

						form.isExit = true;
						urls.reports.detail.and.callFake( () => detailUrlResponse );

						args.saved( body );

						expect( urls.reports.detail ).toHaveBeenCalledWith( body.id );
						expect( res.redirect ).toHaveBeenCalledWith( detailUrlResponse );
						expect( req.flash ).not.toHaveBeenCalled();
						expect( next ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'When it is Save and continue', () => {
					it( 'Should redirect to the barrier detail page', () => {

						const detailUrlResponse = '/detail-url';
						const body = { id: 123 };

						urls.barriers.detail.and.callFake( () => detailUrlResponse );

						args.saved( body );

						expect( req.flash ).toHaveBeenCalledWith( 'barrier-created', body.id );
						expect( urls.barriers.detail ).toHaveBeenCalledWith( body.id );
						expect( res.redirect ).toHaveBeenCalledWith( detailUrlResponse );
						expect( next ).not.toHaveBeenCalled();
					} );
				} );
			} );

			describe( 'Calling formProcessor.process', () => {
				describe( 'When there are no errors', () => {
					it( 'Should not call next', async () => {

						await controller( req, res, next );

						expect( next ).not.toHaveBeenCalledWith();
					} );
				} );

				describe( 'When the formProcessor throws an error', () => {
					describe( 'When the error has a code of UNHANDLED_400', () => {

						let err;

						beforeEach( () => {

							err = new Error( '400' );
							err.code = 'UNHANDLED_400';
						} );

						describe( 'When there is a responseBody', () => {
							describe( 'When there is the correct property in the body', () => {
								it( 'Should render the custom error page', async () => {

									err.responseBody = {
										eu_exit_related: [ 'This field is required.' ]
									};

									processFn.and.callFake( () => Promise.reject( err ) );

									await controller( req, res, next );

									expect( next ).not.toHaveBeenCalled();
									expect( res.render ).toHaveBeenCalledWith( 'reports/views/error/eu-exit-required' );
								} );
							} );

							describe( 'When there is not a property in the response body', () => {
								it( 'Should call next with the err', async () => {

									err.responseBody = {
										random: [ 'a' ]
									};

									processFn.and.callFake( () => Promise.reject( err ) );

									await controller( req, res, next );

									expect( next ).toHaveBeenCalledWith( err );
									expect( res.render ).not.toHaveBeenCalled();
								} );
							} );
						} );

						describe( 'When there is not a responseBody', () => {
							it( 'Should call next', async () => {

								processFn.and.callFake( () => Promise.reject( err ) );

								await controller( req, res, next );

								expect( next ).toHaveBeenCalledWith( err );
							} );
						} );
					} );

					describe( 'When there is no code for the error', () => {
						it( 'Should call next with the error', async () => {

							const err = new Error( 'Some random error' );

							processFn.and.callFake( () => Promise.reject( err ) );

							await controller( req, res, next );

							expect( next ).toHaveBeenCalledWith( err );
						} );
					} );
				} );
			} );
		} );
	} );
} );
