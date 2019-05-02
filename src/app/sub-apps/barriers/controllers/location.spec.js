const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

const modulePath = './location';
const SELECT = 'select-value';

describe( 'Edit barrier location controller', () => {

	let controller;
	let req;
	let res;
	let next;
	let barrier;
	let metadata;
	let validators;
	let Form;
	let form;
	let csrfToken;
	let backend;
	let urls;
	let getCountryValuesResponse;
	let getAdminAreaValuesResponse;
	let getTemplateValuesResponse;

	beforeEach( () => {

		({ csrfToken, req, res, next } = jasmine.helpers.mocks.middleware() );

		metadata = {
			getCountryList: () => [
				{ id: 0, name: 'Choose one' },
				{ id: 1, name: 'country 1' },
				{ id: 2, name: 'country 2' }
			],
			getCountryAdminAreasList: () => [
				{ id: 0, name: 'Choose one' },
				{ id: 1, name: 'admin area 1' },
				{ id: 2, name: 'admin area 2' }
			],
			getAdminArea: jasmine.createSpy( 'metadata.getAdminArea' ).and.callFake( () => 'admin area 2' ),
			isCountryWithAdminArea: jasmine.createSpy( 'metadata.isCountryWithAdminArea' ).and.callFake( () => false ),
			getCountry: jasmine.createSpy( 'metadata.getCountry' )
		};

		form = { c: 3, d: 4 };

		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );
		Form.SELECT = SELECT;

		validators = {
			isCountry: jasmine.createSpy( 'validators.isCountry' ),
			isCountryAdminArea: jasmine.createSpy( 'validators.isCountryAdminArea' ),
			isMetadata: jasmine.createSpy( 'validators.isMetadata' ),
		};

		backend = {
			barriers: {
				saveLocation: jasmine.createSpy( 'backend.barriers.saveLocation' ),
			}
		};

		urls = {
			barriers: {
				detail: jasmine.createSpy( 'urls.barriers.detail' ),
				location: {
					list: jasmine.createSpy( 'urls.barriers.location.list' ),
				}
			}
		};

		barrier = jasmine.helpers.getFakeData( '/backend/barriers/barrier' );
		req.barrier = barrier;

		getCountryValuesResponse = { country: 'country 2' };
		getAdminAreaValuesResponse = { adminAreas: '1234'};
		getTemplateValuesResponse = { country: 'country 1' };

		form = {
			validate: jasmine.createSpy( 'form.validate' ),
			getValues: jasmine.createSpy( 'form.getValues' ).and.callFake( () => getCountryValuesResponse ),
			getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.callFake( () => Object.assign( {}, getTemplateValuesResponse ) )
		};

		controller = proxyquire( modulePath, {
			'../../../lib/metadata': metadata,
			'../../../lib/validators': validators,
			'../../../lib/Form': Form,
			'../../../lib/backend-service': backend,
			'../../../lib/urls': urls,
		} );
	} );

	describe( 'list', () => {
		describe( 'if it is a GET', () => {
			describe('if the country has admin areas', () => {

				beforeEach( () => {

					metadata.isCountryWithAdminArea.and.callFake( () => true );
					metadata.getCountry.and.callFake( () => ({ id: 1, name: 'country 1'}));
				} );

				function checkRender( showAdminAreas ){

					expect(res.render).toHaveBeenCalledWith( 'barriers/views/location/list', {
						country: 'country 1',
						showAdminAreas,
						adminAreas: req.session.location.adminAreas.map( metadata.getAdminArea ),
						csrfToken: req.csrfToken()
					});
				}

				describe( 'If there is already a location in the session', () => {
					it( 'uses the session and renders with page with the admin area section', async () => {

						const country = uuid();
						const adminAreas = [ uuid(), uuid() ];

						req.session.location = {
							country,
							adminAreas,
						};

						await controller.list(req, res, next);

						checkRender( true );

						expect( req.session.location ).toEqual( { country, adminAreas } );
					});
				} );

				describe( 'When there is not any location in the session', () => {
					describe( 'When the barrier has admin areas', () => {
						it( 'Should add the barrier details to the session and render the page with the admin areas section', async () => {

							const adminAreas = [ uuid(), uuid() ];
							barrier.country_admin_areas = adminAreas;

							await controller.list( req, res, next );

							checkRender( true );

							expect( req.session.location ).toEqual( {
								country: barrier.export_country,
								adminAreas,
							} );
						} );
					} );

					describe( 'When the barrier does not have and admin areas', () => {
						it( 'Should add the barrier country to the session, default the adminAreas and render the page with the admin areas section', async () => {

							barrier.country_admin_areas = null;

							await controller.list( req, res, next );

							checkRender( true );

							expect( req.session.location ).toEqual( {
								country: barrier.export_country,
								adminAreas: [],
							} );
						} );
					} );
				} );
			});

			describe('if the country does not have admin areas', () => {
				it( 'renders with page without the admin area section', async () => {

					metadata.isCountryWithAdminArea.and.callFake( () => false );
					metadata.getCountry.and.callFake( () => ({ id: 1, name: 'country 1'}));

					await controller.list(req, res, next);

					expect(res.render).toHaveBeenCalledWith( 'barriers/views/location/list', {
						country: 'country 1',
						showAdminAreas: false,
						adminAreas: [],
						csrfToken: req.csrfToken()
					});
				});
			});
		});

		describe( 'if it is a POST', () => {
			beforeEach( () => {

				req.method = 'POST';

				req.session.location = {
					country: '1234',
					adminAreas: ['4567','7890']
				};

			} );

			describe( 'When the response is a success', () => {
				it( 'Should redirect to the barrir detail page', async () => {

					const response = { isSuccess: true };
					const detailResponse = '/detail/url';

					backend.barriers.saveLocation.and.callFake( () => ({ response }) );
					urls.barriers.detail.and.callFake( () => detailResponse );

					await controller.list( req, res, next );

					expect( req.session.location ).not.toBeDefined();
					expect( next ).not.toHaveBeenCalled();
					expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
				} );
			});

			describe( 'When the response is not a success', () => {
				it( 'Should call next with an error', async () => {

					const response = { isSuccess: false, statusCode: 500 };

					backend.barriers.saveLocation.and.callFake( () => ({ response }) );

					await controller.list( req, res, next );

					const err = new Error( `Unable to update barrier, got ${ response.statusCode } response code` );

					expect( next ).toHaveBeenCalledWith( err );
				} );
			});

			describe( 'When the service throws an error', () => {
				it( 'Should call next with the error', async () => {
					const err = new Error( 'failed API call' );

					backend.barriers.saveLocation.and.callFake( () => Promise.reject( err ) );

					await controller.list( req, res, next );

					expect( backend.barriers.saveLocation ).toHaveBeenCalledWith( req, barrier.id, req.session.location );
					expect( req.session.location ).toBeDefined();
					expect( next ).toHaveBeenCalledWith( err );
					expect( res.render ).not.toHaveBeenCalled();
				} );
			});
		});
	});

	describe( 'edit', () => {

		beforeEach( () => {

			metadata.getCountry.and.callFake( () => ({ id: 1, name: 'country 1'}));
		} );

		async function checkRender( showAdminAreas, sessionAdminAreas = [] ){

			expect( req.session.location ).toEqual( {
				country: barrier.export_country,
				adminAreas: sessionAdminAreas,
			});

			expect( res.render ).toHaveBeenCalledWith( 'barriers/views/location/list', {
				csrfToken,
				showAdminAreas,
				country: 'country 1',
				adminAreas: sessionAdminAreas.map( metadata.getAdminArea ),
			});
		}

		describe( 'if the country has admin areas', () => {

			beforeEach( () => {

				metadata.isCountryWithAdminArea.and.callFake( () => true );
			} );

			describe( 'When the barrier has admin areas', () => {
				it( 'Puts them in the session and render the page with the admin area section', async () => {

					const adminAreas = [ uuid(), uuid() ];
					barrier.country_admin_areas = adminAreas;

					await controller.edit( req, res, next );

					checkRender( true, adminAreas );
				} );
			} );

			describe( 'When the barrier does not have admin areas', () => {
				it( 'Should default the admin areas to an empty array and render the page with the admin area section', async () => {

					barrier.country_admin_areas = null;

					await controller.edit( req, res, next );

					checkRender( true );
				} );
			} );
		});

		describe( 'if the country does not have admin areas', () => {
			it( 'sets the session to the barrier values and renders with page without the admin area section', async () => {

				metadata.isCountryWithAdminArea.and.callFake( () => false );

				await controller.edit( req, res, next );

				checkRender( false );
			});
		});
	} );

	describe( 'adminAreas', () => {
		describe( 'add admin area', () => {

			beforeEach( () => {
				req.session = {
					location: {
						country: 'country 1',
						adminAreas: []
					}
				};
			});

			it( 'Should configure the Form correctly', () => {

				const isMetadataResponse = { ab: '12', cd: '34' };

				validators.isMetadata.and.callFake( () => isMetadataResponse );

				controller.adminAreas.add( req, res );

				const config = Form.calls.argsFor( 0 )[ 1 ];

				expect( config.adminAreas ).toBeDefined();
				expect( config.adminAreas.type ).toEqual( SELECT );
				expect( config.adminAreas.items ).toEqual( metadata.getCountryAdminAreasList() );
				expect( config.adminAreas.validators.length ).toEqual( 2 );
				expect( config.adminAreas.validators[ 0 ].fn ).toEqual( validators.isCountryAdminArea );

				expect( config.status ).not.toBeDefined();
			} );

			describe( 'when it is a GET', () => {
				describe( 'without admin areas in the session', () => {
					it( 'renders the page without admin areas', () => {
						form.getTemplateValues.and.callFake( () => ({ adminAreas: '1234' }) );

						controller.adminAreas.add( req, res );

						expect(res.render).toHaveBeenCalledWith(
							'barriers/views/location/add-admin-area',
							{
								adminAreas: getAdminAreaValuesResponse.adminAreas,
								currentAdminAreas: []
							}
						);
					});
				});

				describe( 'with admin areas in the session', () => {

					beforeEach( () => {
						req.session = {
							location: {
								country: 'country 1',
								adminAreas: [2]
							}
						};
					});

					it( 'renders the page with admin areas', () => {

						form.getTemplateValues.and.callFake( () => ({ adminAreas: '1234' }) );

						controller.adminAreas.add( req, res );

						expect(res.render).toHaveBeenCalledWith(
							'barriers/views/location/add-admin-area',
							{
								adminAreas: getAdminAreaValuesResponse.adminAreas,
								currentAdminAreas: req.session.location.adminAreas.map( metadata.getAdminArea )
							}
						);
					});
				});
			});
			describe( 'when it is a POST', () => {

				beforeEach( () => {
					form.isPost = true;
				});

				describe('When the form has errors', () => {
					it( 'Should render the template', () => {

						form.getTemplateValues.and.callFake( () => ({ adminAreas: '1234' }) );

						form.hasErrors = () => true;

						controller.adminAreas.add( req, res );

						expect( res.render ).toHaveBeenCalledWith( 'barriers/views/location/add-admin-area', Object.assign( {},
							getAdminAreaValuesResponse,
							{currentAdminAreas: []}
						) );
					} );
				});

				describe('When the form does not have errors', () => {
					it('Should add the country to the session', () => {

						form.hasErrors = () => false;

						form.getValues.and.callFake( () => ({ adminAreas: '1234' }) );

						const listResponse = '/list/location';
						urls.barriers.location.list.and.callFake( () => listResponse );

						controller.adminAreas.add( req, res );

						expect(req.session.location.adminAreas).toEqual(['1234']);
						expect( res.redirect).toHaveBeenCalledWith(listResponse);
					});
				});
			});
		});

		describe( 'remove admin area', () => {
			it( 'removes the admin area from the session', () => {
				const adminArea1 = uuid();
				const adminArea2 = uuid();
				const adminAreas = [ adminArea1, adminArea2 ];
				const listResponse = '/list/location';

				req.body = { adminArea: adminArea1 };
				req.session = {location: {adminAreas: adminAreas}};
				urls.barriers.location.list.and.callFake( () => listResponse );

				controller.adminAreas.remove( req, res );

				expect( req.session.location.adminAreas ).toEqual( [ adminArea2 ] );
				expect( res.redirect ).toHaveBeenCalledWith( listResponse );
			});
		});
	} );

	describe( 'country', () => {

		beforeEach( () => {
			req.session = {
				location: { country: 'country 1' }
			};
		});

		it( 'Should configure the Form correctly', () => {

			const isMetadataResponse = { ab: '12', cd: '34' };

			validators.isMetadata.and.callFake( () => isMetadataResponse );

			controller.country( req, res, next );

			const config = Form.calls.argsFor( 0 )[ 1 ];

			expect( config.country ).toBeDefined();
			expect( config.country.type ).toEqual( SELECT );
			expect( config.country.values ).toEqual( [ 'country 1' ] );
			expect( config.country.items ).toEqual( metadata.getCountryList() );
			expect( config.country.validators.length ).toEqual( 1 );
			expect( config.country.validators[ 0 ].fn ).toEqual( validators.isCountry );

			expect( config.status ).not.toBeDefined();
		} );

		describe('When it is a GET', () => {
			it( 'Should render the template', () => {
				controller.country( req, res );

				expect( res.render ).toHaveBeenCalledWith( 'barriers/views/location/country', Object.assign( {},
					getTemplateValuesResponse,
				) );
			} );
		});

		describe('When it is a POST', () => {

			beforeEach( () => {
				form.isPost = true;
			});

			describe('When the form has errors', () => {
				it( 'Should render the template', () => {

					form.hasErrors = () => true;

					controller.country( req, res );

					expect( res.render ).toHaveBeenCalledWith( 'barriers/views/location/country', Object.assign( {},
						getTemplateValuesResponse,
					) );
				} );
			});

			describe('When the form does not have errors', () => {

				beforeEach( () => {

					form.hasErrors = () => false;
				} );

				it('Should add the country to the session', () => {

					const listResponse = '/list/location';
					urls.barriers.location.list.and.callFake( () => listResponse );

					controller.country( req, res );

					expect( req.session.location.country ).toEqual( 'country 2' );
					expect( res.redirect).toHaveBeenCalledWith( listResponse );
				});

				describe( 'With admin areas in the session', () => {

					let sessionAdminArea = uuid();

					beforeEach( () => {

						req.session.location.adminAreas = [ sessionAdminArea ];
					} );

					describe( 'If the country does not have admin areas', () => {
						it( 'Should remove the admin areas in the session', () => {

							controller.country( req, res );

							expect( req.session.location.adminAreas ).toEqual( [] );
						} );
					} );

					describe( 'If the country has admin areas', () => {
						it( 'Should leave the session values as they are', () => {

							metadata.isCountryWithAdminArea.and.callFake( () => true );

							controller.country( req, res );

							expect( req.session.location.adminAreas ).toEqual( [ sessionAdminArea ] );
						} );
					} );
				} );
			});
		});
	} );
} );
