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

	beforeEach( () => {

		csrfToken = uuid();
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
			getAdminArea: jasmine.createSpy( 'metadata.getAdminArea' ).and.callFake(() => 'admin area 2'),
			isCountryWithAdminArea: jasmine.createSpy( 'metadata.isCountryWithAdminArea' ).and.callFake(() => false),
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
					add_admin_area: jasmine.createSpy( 'urls.barriers.location.add_admin_area' )
				}
			}
		};

		barrier = jasmine.helpers.getFakeData( '/backend/barriers/barrier' );

		req = {
			barrier,
			session: {},
			csrfToken: () => csrfToken,
			params: {},
			query: {}
		};
		

		res = {
			render: jasmine.createSpy( 'res.render' ),
			redirect: jasmine.createSpy( 'res.redirect' )
		};

		getCountryValuesResponse = { country: 'country 2' };
		getAdminAreaValuesResponse = { adminAreas: '1234'};
		getTemplateValuesResponse = { country: 'country 1' };

		form = {
			validate: jasmine.createSpy( 'form.validate' ),
			getValues: jasmine.createSpy( 'form.getValues' ).and.callFake( () => getCountryValuesResponse ),
			getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.callFake( () => Object.assign( {}, getTemplateValuesResponse ) )
		};

		next = jasmine.createSpy( 'next' );

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
				it( 'renders with page with the admin area section', async () => {

					metadata.isCountryWithAdminArea.and.callFake( () => true );
					metadata.getCountry.and.callFake( () => {
						return { id: 1, name: 'country 1'}
					});

					await controller.list(req, res, next);

					expect(res.render).toHaveBeenCalledWith( 'barriers/views/location/list', {
						country: 'country 1', 
						showAdminAreas: true,
						adminAreas: [],
						csrfToken: req.csrfToken()
					});
				});
			})
			describe('if the country does not have admin areas', () => {
				it( 'renders with page without the admin area section', async () => {

					metadata.isCountryWithAdminArea.and.callFake( () => false );
					metadata.getCountry.and.callFake( () => {
						return { id: 1, name: 'country 1'}
					});

					await controller.list(req, res, next);

					expect(res.render).toHaveBeenCalledWith( 'barriers/views/location/list', {
						country: 'country 1', 
						showAdminAreas: false,
						adminAreas: [],
						csrfToken: req.csrfToken()
					});
				})
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
			})

			describe( 'When the response is not a success', () => {
				it( 'Should call next with an error', async () => {

					const response = { isSuccess: false, statusCode: 500 };

					backend.barriers.saveLocation.and.callFake( () => ({ response }) );

					await controller.list( req, res, next );

					const err = new Error( `Unable to update barrier, got ${ response.statusCode } response code` );

					expect( next ).toHaveBeenCalledWith( err );
				} );
			})

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
			})
		});
	});

	describe( 'add admin area', () => {

		beforeEach( () => {
			req.session = {
				location: { 
					country: 'country 1',
					adminAreas: []
				}
			}
		});

		it( 'Should configure the Form correctly', () => {

			const isMetadataResponse = { ab: '12', cd: '34' };

			validators.isMetadata.and.callFake( () => isMetadataResponse );

			controller.add_admin_area( req, res );

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

					controller.add_admin_area( req, res );

					expect(res.render).toHaveBeenCalledWith(
						'barriers/views/location/add-admin-area',
						{
							adminAreas: getAdminAreaValuesResponse.adminAreas,
							currentAdminAreas: []
						}
					)
				});
			});
	
			describe( 'with admin areas in the session', () => {

				beforeEach( () => {
					req.session = {
						location: { 
							country: 'country 1',
							adminAreas: [2]
						}
					}
				});

				it( 'renders the page with admin areas', () => {

					form.getTemplateValues.and.callFake( () => ({ adminAreas: '1234' }) );

					controller.add_admin_area( req, res );

					expect(res.render).toHaveBeenCalledWith(
						'barriers/views/location/add-admin-area',
						{
							adminAreas: getAdminAreaValuesResponse.adminAreas,
							currentAdminAreas: req.session.location.adminAreas.map( metadata.getAdminArea ) 
						}
					)
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

					controller.add_admin_area( req, res );

					expect( res.render ).toHaveBeenCalledWith( 'barriers/views/location/add-admin-area', Object.assign( {},
						getAdminAreaValuesResponse,
						{currentAdminAreas: []}
					) );
				} );
			})

			describe('When the form does not have errors', () => {
				it('Should add the country to the session', () => {
				
					form.hasErrors = () => false;

					form.getValues.and.callFake( () => ({ adminAreas: '1234' }) );

					const listResponse = '/list/location';
					urls.barriers.location.list.and.callFake( () => listResponse );

					controller.add_admin_area( req, res );

					expect(req.session.location.adminAreas).toEqual(['1234']);
					expect( res.redirect).toHaveBeenCalledWith(listResponse);
				})
			})
		})
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

			controller.remove_admin_area( req, res );

			expect( req.session.location.adminAreas ).toEqual( [ adminArea2 ] );
			expect( res.redirect ).toHaveBeenCalledWith( listResponse );
		});
	});

	describe( 'country', () => {

		beforeEach( () => {
			req.session = {
				location: { country: 'country 1' }
			}
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
			})

			describe('When the form does not have errors', () => {
				it('Should add the country to the session', () => {
				
					form.hasErrors = () => false;

					const listResponse = '/list/location';
					urls.barriers.location.list.and.callFake( () => listResponse );

					controller.country( req, res );

					expect(req.session.location.country).toEqual('country 2');
					expect( res.redirect).toHaveBeenCalledWith(listResponse);
				})
			})
		});
	} );
} );
