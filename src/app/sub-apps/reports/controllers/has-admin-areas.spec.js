const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const HttpResponseError = require( '../../../lib/HttpResponseError' );

const modulePath = './has-admin-areas';

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
	let govukItemsFromObj;
	let govukItemsFromObjResponse;
	let getValuesResponse;
	let getTemplateValuesResponse;

	beforeEach( () => {

		( { req, res, next } = jasmine.helpers.mocks.middleware() );

		govukItemsFromObjResponse = [ { items: 1 } ];
		getValuesResponse = { hasAdminAreas: 'true'};
		getTemplateValuesResponse = { countryId: uuid(), c: 3, d: 4 };
		form = {
			hasErrors: jasmine.createSpy( 'form.hasErrors' ),
			validate: jasmine.createSpy( 'form.validate' ),
			getValues: jasmine.createSpy( 'form.getValues' ).and.callFake( () => getValuesResponse ),
			getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.callFake( () => getTemplateValuesResponse )
		};

		validators = {
			isMetadata: jasmine.createSpy( 'validators.isMetaData' ),
		};

		metadata = {
			statusTypes: { a: 1, b: 2 },
		};

		urls = {
			reports: {
				detail: jasmine.createSpy( 'urls.reports.detail' ),
				adminAreas: {
					list: jasmine.createSpy( 'urls.reports.adminAreas.list' ),
					add: jasmine.createSpy( 'urls.reports.adminAreas.add' ),
				},
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
		govukItemsFromObj = jasmine.createSpy( 'govukItemsFromObj' ).and.callFake( () => govukItemsFromObjResponse );

		controller = proxyquire( modulePath, {
			'../../../lib/backend-service': backend,
			'../../../lib/metadata': metadata,
			'../../../lib/Form': Form,
			'../../../lib/urls': urls,
			'../../../lib/validators': validators,
			'../../../lib/govuk-items-from-object': govukItemsFromObj
		} );
		req.params.countryId = '1234';
	} );

	describe( 'hasAdminAreas', () => {

		const template = 'reports/views/has-admin-areas';

		it( 'Should setup the form correctly', async () => {

			let boolResponse = { 'boolResponse': 'yes' };

			validators.isMetadata.and.callFake( ( key ) => {

				if( key === 'bool' ){ return boolResponse; }
			} );

			govukItemsFromObjResponse = [
				{
					value: 'true',
					text: 'yes'
				},{
					value: 'false',
					text: 'No - just part of the country'
				}
			];

			await controller( req, res, next );

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];

			expect( Form ).toHaveBeenCalled();
			expect( args[ 0 ] ).toEqual( req );

			expect( config.hasAdminAreas ).toBeDefined();
			expect( config.hasAdminAreas.type ).toEqual( Form.RADIO );
			expect( config.hasAdminAreas.values ).toEqual( [null] );
			expect( config.hasAdminAreas.validators[ 0 ].fn ).toEqual( boolResponse );
			expect( config.hasAdminAreas.items ).toEqual( [
				{
					value: 'true',
					text: 'yes'
				},{
					value: 'false',
					text: 'No - just part of the country'
				}
			] );
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

				beforeEach( () => {
					form.hasErrors.and.callFake( () => false );
				});

				describe( 'When selecting the entire country', () => {

					let saveValues;

					beforeEach( () => {
						form.isPost = true;
					} );

					describe(' When updating a report', () => {

						let report;

						beforeEach( () => {
							report = {
								id: 1,
								problem_status: { a: 1 },
								is_resolved: false,
								resolved_date: { c: 3 },
								export_country: 'country',
								country_admin_areas: []
							};

							saveValues = Object.assign( {}, {
								status: report.problem_status,
								isResolved: false,
								resolvedDate: report.resolved_date,
								country: '1234',
								adminAreas: []
							} );

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

									const err = next.calls.argsFor( 0 )[ 0 ];
									expect( res.redirect ).not.toHaveBeenCalled();
									expect( next ).toHaveBeenCalled();
									expect( err instanceof HttpResponseError ).toEqual( true );
									expect( err.message.startsWith( 'Unable to update report' ) ).toEqual( true );
								} );
							} );
						} );
					});
					describe(' When creating a new report', () => {

						beforeEach( () => {

							sessionValues = {
								startFormValues: {status: 1 },
								isResolvedFormValues: { isReolved: false, resolvedDate: { c: 3 }  }
							};

							saveValues = Object.assign( {}, {
								status: sessionValues.startFormValues,
								isResolved: false,
								resolvedDate: sessionValues.isResolvedFormValues,
								country: '1234',
								adminAreas: []
							} );

							req.session = sessionValues;
						} );

						describe( 'When the response is a success', () => {

							const response = { isSuccess: true };

							it( 'Should save the report and delete the session data', async () => {
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

								const err = next.calls.argsFor( 0 )[ 0 ];

								expect( next ).toHaveBeenCalled();
								expect( err instanceof HttpResponseError ).toEqual( true );
								expect( err.message.startsWith( 'Unable to save report' ) ).toEqual( true );
							} );
						} );
					});
				});
				describe( 'When selecting only parts of the country', () => {

					beforeEach( () => {
						getValuesResponse = { hasAdminAreas: 'false'};
					} );

					describe( 'When there is no report or the selected country is different', () => {
						it( 'Should delete the admin areas session and redirect to add an admin area', () => {
							const addAdminAreaResponse = 'add/admin/area';

							urls.reports.adminAreas.add.and.callFake( () => addAdminAreaResponse );

							controller( req, res, next );

							expect( req.session.adminAreas ).toBeUndefined();
							expect( res.redirect ).toHaveBeenCalledWith( addAdminAreaResponse  );
						});
					});
					describe( 'When there is a report with admin areas and the same country', () => {
						it( 'Should populate the admin areas session and redirect straight to the list ', () => {

							req.report = {
								id: 1,
								problem_status: { a: 1 },
								is_resolved: false,
								resolved_date: { c: 3 },
								export_country: '1234',
								country_admin_areas: ['3456']
							};

							const adminAreasResponse = 'admin/area';

							urls.reports.adminAreas.list.and.callFake( () => adminAreasResponse );

							controller( req, res, next );

							expect( req.session.adminAreas ).toEqual(['3456']);
							expect( res.redirect ).toHaveBeenCalledWith( adminAreasResponse  );
						});
					});
				});
			} );
		} );
	} );
} );
