const proxyquire = require( 'proxyquire' );

const modulePath = './country';

describe( 'Report controllers', () => {

	let controller;
	let req;
	let res;
	let next;
	let Form;
	let form;
	let urls;
	let metadata;
	let validators;
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

		validators = {
			isCountry: jasmine.createSpy( 'validators.isCountry' ),
		};

		metadata = {
			getCountryList: () => [
				{ id: 0, name: 'Choose one' },
				{ id: 1, name: 'country 1' },
				{ id: 2, name: 'country 2' }
			],
		};

		urls = {
			reports: {
				hasSectors: jasmine.createSpy( 'urls.reports.hasSectors' ),
			},
		};

		backend = {
			reports: {
				save: jasmine.createSpy( 'backend.reports.save' ),
				update: jasmine.createSpy( 'backend.reports.update' ),
			}
		};

		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );

		controller = proxyquire( modulePath, {
			'../../../lib/backend-service': backend,
			'../../../lib/metadata': metadata,
			'../../../lib/Form': Form,
			'../../../lib/urls': urls,
			'../../../lib/validators': validators,
		} );
	} );

	describe( 'country', () => {

		const template = 'reports/views/country';

		it( 'Should setup the form correctly', async () => {

			const report = {
				export_country: [ 'a country' ]
			};

			req.report = report;

			await controller( req, res, next );

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];

			expect( Form ).toHaveBeenCalled();
			expect( args[ 0 ] ).toEqual( req );

			expect( config.country ).toBeDefined();
			expect( config.country.type ).toEqual( Form.SELECT );
			expect( config.country.values ).toEqual( [ report.export_country ] );
			expect( config.country.items ).toEqual( metadata.getCountryList() );
			expect( config.country.validators.length ).toEqual( 1 );
			expect( config.country.validators[ 0 ].fn ).toEqual( validators.isCountry );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the correct template', async () => {

				await controller( req, res, next );

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

					await controller( req, res, next );

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
							is_resolved: false,
							resolved_date: { c: 3 }
						};

						saveValues = Object.assign( {}, {
							status: report.problem_status,
							isResolved: false,
							resolvedDate: report.resolved_date
						}, getValuesResponse );

						req.report = report;
					} );

					it( 'Should update the report with the report data', async () => {

						await controller( req, res, next );

						const args = backend.reports.update.calls.argsFor( 0 );

						expect( args[ 0 ] ).toEqual( req );
						expect( args[ 1 ] ).toEqual( report.id );
						expect( args[ 2 ] ).toEqual( saveValues );
					} );

					describe( 'When the update throws an error', () => {
						it( 'Should call next with the error', async () => {

							const err = new Error( 'an update error' );

							backend.reports.update.and.callFake( () => Promise.reject( err ) );

							await controller( req, res, next );

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

								await controller( req, res, next );

								expect( res.redirect ).toHaveBeenCalledWith( hasSectorsResponse );
								expect( urls.reports.hasSectors ).toHaveBeenCalledWith( body.id );
								expect( next ).not.toHaveBeenCalled();
							} );
						} );

						describe( 'When the response is NOT a success', () => {
							it( 'Should redirect to the correct url', async () => {

								backend.reports.update.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode: 404 } } ) );

								await controller( req, res, next );

								expect( res.redirect ).not.toHaveBeenCalled();
								expect( next ).toHaveBeenCalledWith( new Error( 'Unable to update report, got 404 response code' ) );
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

							await controller( req, res, next );

							expect( req.session ).toEqual( {} );
						} );

						describe( 'When there is not a body with an id', () => {
							it( 'Should call next with an error', async () => {

								backend.reports.save.and.callFake( () => Promise.resolve( { response, body: {} } ) );

								await controller( req, res, next );

								expect( next ).toHaveBeenCalledWith( new Error( 'No id created for report' ) );
							} );
						} );

						describe( 'When there is a body with id', () => {
							it( 'Should redirect to the correct url', async () => {

								const hasSectorsResponse = '/a/b/c';

								urls.reports.hasSectors.and.callFake( () => hasSectorsResponse );
								backend.reports.save.and.callFake( () => Promise.resolve( { response, body: { id: 10 } } ) );

								await controller( req, res, next );

								expect( res.redirect ).toHaveBeenCalledWith( hasSectorsResponse  );
								expect( urls.reports.hasSectors ).toHaveBeenCalledWith( 10 );
							} );
						} );
					} );

					describe( 'When the response is not a success', () => {
						it( 'Should call next with an error', async () => {

							backend.reports.save.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode: 123 } } ) );

							await controller( req, res, next );

							expect( next ).toHaveBeenCalledWith( new Error( 'Unable to save report, got 123 response code' ) );
						} );
					} );
				} );
			} );
		} );
	} );
} );
