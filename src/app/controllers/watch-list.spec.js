const proxyquire = require( 'proxyquire' );
const modulePath = './watch-list';

let controller;
let req;
let res;
let next;
let csrfToken;
let getValuesResponse;
let getTemplateValuesResponse;
let backend;
let urls;
let metadata;
let validators;
let Form;
let form;
let watchList;

describe( 'Watch list controller', () => {

	beforeEach( () => {

		backend = { watchList: { save: jasmine.createSpy( 'backend.watchList.save' ) } };

		( { req, res, next, csrfToken } = jasmine.helpers.mocks.middleware() );

		req.session = { user: { user_profile: {} } };

		urls = {
			index: jasmine.createSpy( 'urls.index' )
		};

		metadata = {
			getCountry: jasmine.createSpy( 'validators.getCountry' ),
			getSector: jasmine.createSpy( 'validators.getSector' ),
			getBarrierType: jasmine.createSpy( 'validators.getBarrierType' ),
			getBarrierPriority: jasmine.createSpy( 'validators.getBarrierPriority' ),
			getOverseasRegion: jasmine.createSpy( 'validators.getOverseasRegion' ),
		};

		validators = {
			isCountryOrAdminArea: jasmine.createSpy( 'validators.isCountryOrAdminArea' ),
			isOverseasRegion: jasmine.createSpy( 'validators.isOverseasRegion' ),
			isSector: jasmine.createSpy( 'validators.isSector' ),
			isBarrierType: jasmine.createSpy( 'validators.isBarrierType' ),
			isBarrierPriority: jasmine.createSpy( 'validators.isBarrierPriority' ),
		};

		getValuesResponse = { name: 'Test name' };
		getTemplateValuesResponse = { c: 3, d: 4 };
		form = {
			validate: jasmine.createSpy( 'form.validate' ),
			getValues: jasmine.createSpy( 'form.getValues' ).and.callFake( () => getValuesResponse ),
			getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.callFake( () => Object.assign( {}, getTemplateValuesResponse ) )
		};

		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );

		controller = proxyquire( modulePath, {
			'../lib/metadata': metadata,
			'../lib/validators': validators,
			'../lib/Form': Form,
			'../lib/backend-service': backend,
			'../lib/urls': urls,
		} );
	} );

	describe ( 'Save', () => {
		describe( 'When it is a GET', () => {
			it( 'Should setup the form correctly', async () => {

				await controller.save( req, res, next );

				const config = Form.calls.argsFor( 0 )[1];

				expect( config.name ).toBeDefined();
				expect( config.name.required ).toBeDefined();
				expect( config.name.values ).toEqual( [null] );
			});

			it( 'Should render the template', async () => {

				await controller.save( req, res, next );

				expect( res.render ).toHaveBeenCalledWith( 'watch-list/save', {
					c: 3, d: 4,
					filters: {},
					queryString: {},
					filterList: [  ],
					csrfToken: csrfToken
				} );
			});
		});

		describe( 'When it is a POST', () => {

			beforeEach( () => {
				form.isPost = true;
			} );

			describe( 'When the form data is not valid', () => {
				it( 'Should render the template', async () => {

					form.hasErrors = () => true;

					await controller.save( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( 'watch-list/save', {
						c: 3, d: 4,
						filters: {},
						queryString: {},
						filterList: [  ],
						csrfToken: csrfToken
					} );
					expect( backend.watchList.save ).not.toHaveBeenCalled();
				} );
			} );

			describe( 'When the form data is valid', () => {

				beforeEach( () => {
					form.hasErrors = () => false;
				} );

				describe( 'When there is are no errors', () => {
					describe( 'With a success response', () => {
						it( 'Saves the watch list and redirects to the dashboard', async () => {

							const indexResponse = '/';
							const watchListResponse = {
									response: { isSuccess: true  }
							};

							urls.index.and.callFake( () => indexResponse );
							backend.watchList.save.and.callFake( () => Promise.resolve( watchListResponse ) );

							await controller.save( req, res, next );

							expect( backend.watchList.save ).toHaveBeenCalledWith(
									req,
									{ watchList: { name: 'Test name', filters: {} } }
							);
							expect( req.session.user ).not.toBeDefined();
							expect( res.redirect ).toHaveBeenCalledWith( indexResponse );
						});
					});

					describe( 'Without a success response', () => {
						it( 'Should render the template', async () => {

							const watchListResponse = {
									response: { isSuccess: false  },
							};

							backend.watchList.save.and.callFake( () => Promise.resolve( watchListResponse ) );

							await controller.save( req, res, next );

							expect( next ).toHaveBeenCalledWith( new Error( `Unable to save watch list, got ${ watchListResponse.response.statusCode } response code` ) );
						});
					});
				});

				describe( 'When there is an error', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'issue with backend' );

						backend.watchList.save.and.callFake( () => Promise.reject( err ) );

						await controller.save( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
					} );
				});
			} );
		});
	});

	describe ( 'Remove', () => {

		beforeEach(() => {
			req.session.user.user_profile.watchList = watchList;
		});

		describe( 'Without an error', () => {
			describe( 'With a success response', () => {
				it( 'Clears the watch list from the user profile', async () => {

					const indexResponse = '/';
					const watchListResponse = {
						response: { isSuccess: true  }
					};

					urls.index.and.callFake( () => indexResponse );
					backend.watchList.save.and.callFake( () => Promise.resolve( watchListResponse ) );

					await controller.remove( req, res, next );

					expect( req.session.user ).toBeUndefined();
					expect( backend.watchList.save ).toHaveBeenCalledWith( req, { watchList: null } );
					expect( res.redirect ).toHaveBeenCalledWith( indexResponse );
				});
			});

			describe( ' Without a success response', () => {
				it( 'Should call next with the error', async () => {
					const watchListResponse = {
						response: { isSuccess: false  }
					};

					backend.watchList.save.and.callFake( () => Promise.resolve( watchListResponse ) );

					await controller.remove( req, res, next );

					expect( next ).toHaveBeenCalledWith( new Error( `Unable to get user info, got ${ watchListResponse.response.statusCode } response code` ) );

					expect( res.render ).not.toHaveBeenCalled();
				});
			});
		});

		describe( 'With an error', () => {
			it( 'Should call next with the error', async () => {
				const err = new Error( 'issue with backend' );

				backend.watchList.save.and.callFake( () => Promise.reject( err ) );

				await controller.remove( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
			} );
		});
	});
});
