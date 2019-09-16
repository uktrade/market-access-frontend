const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const HttpResponseError = require( '../../../lib/HttpResponseError' );

const modulePath = './admin-areas';

describe( 'Report controllers', () => {

	let controller;
	let req;
	let res;
	let next;
	let csrfToken;
	let Form;
	let form;
	let urls;
	let metadata;
	let backend;
	let validators;
	let getValuesResponse;
	let getTemplateValuesResponse;

	beforeEach( () => {

		( { req, res, next, csrfToken } = jasmine.helpers.mocks.middleware() );

		req.params.countryId = '1234';

		getValuesResponse = { adminAreas: 'admin area 1'};
		getTemplateValuesResponse = { countryId: '1234', c: 3, d: 4 };
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
			getAdminArea: jasmine.createSpy( 'metadata.getAdminArea' ),
			getCountryAdminAreasList: () => [
				{ id: 0, name: 'Choose one' },
				{ id: 1, name: 'admin area 1' },
				{ id: 2, name: 'admin area 2' }
			],
		};

		backend = {
			reports: {
				save: jasmine.createSpy( 'backend.reports.save' ),
				update: jasmine.createSpy( 'backend.reports.update' )
			}
		};

		urls = {
			reports: {
				detail: jasmine.createSpy( 'urls.reports.detail' ),
				hasSectors: jasmine.createSpy( 'urls.reports.hasSectors' ),
				adminAreas: {
					list: jasmine.createSpy( 'urls.reports.adminAreas.list' ),
					add: jasmine.createSpy( 'urls.reports.adminAreas.add' ),
					remove: jasmine.createSpy( 'urls.reports.adminAreas.remove' ),
				}
			},
		};

		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );

		controller = proxyquire( modulePath, {
			'../../../lib/metadata': metadata,
			'../../../lib/backend-service': backend,
			'../../../lib/Form': Form,
			'../../../lib/urls': urls,
			'../../../lib/validators': validators,
		} );
	} );

	describe( 'Admin areas', () => {

		function checkRender( adminAreas ){

			expect( res.render ).toHaveBeenCalledWith( 'reports/views/admin-areas', { countryId: '1234', adminAreas: adminAreas.map( metadata.getAdminArea ), csrfToken } );
		}

		describe( 'List', () => {

			beforeEach( () => {

				req.report = {};
			} );

			describe( 'When it is a GET', () => {
				describe( 'With admin areas in the session', () => {
					it( 'Should render the page with the admin areas', async () => {

						const adminAreas = [ uuid(), uuid(), uuid() ];

						req.session.adminAreas = adminAreas;

						await controller.list( req, res, next );

						checkRender( adminAreas );
					} );
				} );
				describe( 'With no admin areas', () => {
					it( 'Should render the page with and empty list', async () => {

						await controller.list( req, res, next );

						checkRender( [] );
					} );
				} );
			} );

			describe( 'When it is a POST', () => {

				let sessionValues;

				beforeEach( () => {
					req.method = 'POST';
					req.session.adminAreas = ['1234', '5678'];
				} );

				describe( 'If there is a report', () => {

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
							resolvedDate: report.resolved_date,
							country: '1234',
							adminAreas: [ '1234', '5678']
						} );

						req.report = report;
					} );

					it( 'Should update the report with the report data', async () => {

						await controller.list( req, res, next );

						const args = backend.reports.update.calls.argsFor( 0 );

						expect( args[ 0 ] ).toEqual( req );
						expect( args[ 1 ] ).toEqual( report.id );
						expect( args[ 2 ] ).toEqual( saveValues );
					} );

					describe( 'When the update throws an error', () => {
						it( 'Should call next with the error', async () => {

							const err = new Error( 'an update error' );

							backend.reports.update.and.callFake( () => Promise.reject( err ) );

							await controller.list( req, res, next );

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

								await controller.list( req, res, next );

								expect( res.redirect ).toHaveBeenCalledWith( hasSectorsResponse );
								expect( urls.reports.hasSectors ).toHaveBeenCalledWith( body.id );
								expect( next ).not.toHaveBeenCalled();
							} );
						} );

						describe( 'When the response is NOT a success', () => {
							it( 'Should redirect to the correct url', async () => {

								backend.reports.update.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode: 404 } } ) );

								await controller.list( req, res, next );

								const err = next.calls.argsFor( 0 )[ 0 ];

								expect( res.redirect ).not.toHaveBeenCalled();
								expect( next ).toHaveBeenCalled();
								expect( err.message.startsWith( 'Unable to update report' ) ).toEqual( true );
								expect( err instanceof HttpResponseError ).toEqual( true );
							} );
						} );
					} );
				});

				describe( 'If there is only session data', () => {
					beforeEach( () => {

						req.method = 'POST';

						sessionValues = {
							startFormValues: { x: 1 },
							isResolvedFormValues: { y: 2 },
							adminAreas: ['1234', '5678']
						};

						req.session = sessionValues;
					} );

					describe( 'When the response is a success', () => {

						const response = { isSuccess: true };

						it( 'Should delete the session data', async () => {

							backend.reports.save.and.callFake( () => Promise.resolve( { response } ) );

							await controller.list( req, res, next );

							expect( req.session ).toEqual( {} );
						} );

						describe( 'When there is not a body with an id', () => {
							it( 'Should call next with an error', async () => {

								backend.reports.save.and.callFake( () => Promise.resolve( { response, body: {} } ) );

								await controller.list( req, res, next );

								expect( next ).toHaveBeenCalledWith( new Error( 'No id created for report' ) );
							} );
						} );

						describe( 'When there is a body with id', () => {
							describe( 'When it is save and exit', () => {
								it( 'Should redirect to the correct url', async () => {

									const detailResponse = '/a/b/c';

									req.body.action = 'exit';
									urls.reports.detail.and.callFake( () => detailResponse );
									backend.reports.save.and.callFake( () => Promise.resolve( { response, body: { id: 10 } } ) );

									await controller.list( req, res, next );

									expect( res.redirect ).toHaveBeenCalledWith( detailResponse  );
									expect( urls.reports.detail ).toHaveBeenCalledWith( 10 );
								} );
							} );

							describe( 'When it is save and continue', () => {
								it( 'Should redirect to the correct url', async () => {

									const hasSectorsResponse = '/a/b/c';

									urls.reports.hasSectors.and.callFake( () => hasSectorsResponse );
									backend.reports.save.and.callFake( () => Promise.resolve( { response, body: { id: 10 } } ) );

									await controller.list( req, res, next );

									expect( res.redirect ).toHaveBeenCalledWith( hasSectorsResponse  );
									expect( urls.reports.hasSectors ).toHaveBeenCalledWith( 10 );
								} );
							} );
						} );
					} );

					describe( 'When the response is not a success', () => {
						it( 'Should call next with an error', async () => {

							backend.reports.save.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode: 123 } } ) );

							await controller.list( req, res, next );

							const err = next.calls.argsFor( 0 )[ 0 ];

							expect( next ).toHaveBeenCalled();
							expect( err instanceof HttpResponseError ).toEqual( true );
							expect( err.message.startsWith( 'Unable to save report' ) ).toEqual( true );
						} );
					} );
				});
			});
		}) ;
		describe( 'Remove', () => {

			beforeEach(() => {
				req.report = {};
			});

			describe( 'When there is a report', () => {
				it( 'Should remove the adminArea in the session list and redirect', () => {
					const adminArea = uuid();
					const adminAreas = [ uuid(), uuid(), adminArea ];
					const expected = adminAreas.slice( 0, 2 );
					const adminAreasResponse = '/to/admin/areas';

					urls.reports.adminAreas.list.and.callFake( () => adminAreasResponse );
					req.session.adminAreas = adminAreas;
					req.body = { adminArea };

					controller.remove( req, res );

					expect( req.session.adminAreas ).toEqual( expected );
					expect( res.redirect ).toHaveBeenCalledWith( adminAreasResponse );
					expect( urls.reports.adminAreas.list ).toHaveBeenCalledWith( undefined, '1234' );
				});
			});

			describe( 'When there is not a report', () => {
				it( 'Should remove the adminArea in the session list and redirect', () => {
					const adminArea = uuid();
					const adminAreas = [ uuid(), uuid(), adminArea ];
					const expected = adminAreas.slice( 0, 2 );
					const adminAreasResponse = '/to/admin/areas';
					const reportId = '123';

					urls.reports.adminAreas.list.and.callFake( () => adminAreasResponse );
					req.session.adminAreas = adminAreas;
					req.body = { adminArea };
					req.report = { id: reportId };

					controller.remove( req, res );

					expect( req.session.adminAreas ).toEqual( expected );
					expect( res.redirect ).toHaveBeenCalledWith( adminAreasResponse );
					expect( urls.reports.adminAreas.list ).toHaveBeenCalledWith( reportId, '1234' );
				});
			});
		});

		describe( 'Add', () => {

			let template = 'reports/views/add-admin-area';
			let getAddAdminAreaTemplateValuesResponse = { countryId: '1234', c: 3, d: 4, currentAdminAreas: [] };

			it( 'Should setup the form correctly',  () => {

				controller.add( req, res, next );

				const args = Form.calls.argsFor( 0 );
				const config = args[ 1 ];

				expect( Form ).toHaveBeenCalled();
				expect( args[ 0 ] ).toEqual( req );

				expect( config.adminAreas ).toBeDefined();
				expect( config.adminAreas.type ).toEqual( Form.SELECT );
				expect( config.adminAreas.items ).toEqual( metadata.getCountryAdminAreasList() );
				expect( config.adminAreas.validators.length ).toEqual( 2 );
				expect( config.adminAreas.validators[ 0 ].fn ).toEqual( validators.isCountryAdminArea );
			});

			describe( 'When it is a GET', () => {
				it( 'Should render the correct template', () => {

					controller.add( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( template, getAddAdminAreaTemplateValuesResponse );
				} );

				describe( 'When there is one sector in the session', () => {
					it( 'Should setup the form correctly', async () => {

						req.session.adminAreas = [ 2 ];

						controller.add( req, res );

						const args = Form.calls.argsFor( 0 );
						const config = args[ 1 ];

						expect( Form ).toHaveBeenCalled();
						expect( args[ 0 ] ).toEqual( req );

						expect( config.adminAreas ).toBeDefined();
						expect( config.adminAreas.type ).toEqual( Form.SELECT );
						expect( config.adminAreas.items ).toEqual( metadata.getCountryAdminAreasList().filter( ( adminArea ) => adminArea.value != 2 ) );
						expect( config.adminAreas.validators[ 0 ].fn ).toEqual( validators.isCountryAdminArea );
					} );
				} );

				describe( 'When there are sectors in the session', () => {
					it( 'Should render with the session sectors', () => {

						const adminAreas = [ 1, 2];
						req.session.adminAreas = adminAreas;
						const expected = Object.assign( {}, getAddAdminAreaTemplateValuesResponse, { currentAdminAreas: adminAreas.map( metadata.getAdminArea ) } );

						controller.add( req, res );

						expect( res.render ).toHaveBeenCalledWith( template, expected );
					} );
				} );
			} );

			describe( 'When it is a POST', () => {

				beforeEach( () => {
					form.isPost = true;
				} );

				describe( 'When the form has errors', () => {
					// Should probably test both errors show correctly
					it ('Should render the template ', () => {

						form.hasErrors.and.callFake( () => true );

						controller.add( req, res, next );

						expect( res.redirect ).not.toHaveBeenCalled();
					});
				});

				describe( 'When the form does not have errors', () => {
					it( 'Should add the admin area to the list and redirect', () => {

						const adminArea = uuid();
						const adminAreasResponse = '/list/admin-areas';

						form.hasErrors = () => false;
						form.getValues.and.callFake( () => ({ adminAreas: adminArea }) );
						urls.reports.adminAreas.list.and.callFake( () => adminAreasResponse );

						controller.add( req, res );

						expect( req.session.adminAreas ).toEqual( [ adminArea ] );
						expect( res.redirect ).toHaveBeenCalledWith( adminAreasResponse );
					} );
				});
			} );
		});
	} );
} );
