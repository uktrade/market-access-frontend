const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

const modulePath = './status';

const GROUP = 'group';
const RADIO = 'select';

describe( 'Barrier status controller', () => {

	let controller;
	let req;
	let res;
	let next;
	let backend;
	let urls;
	let csrfToken;
	let Form;
	let form;
	let getValuesResponse;
	let getTemplateValuesResponse;
	let validators;
	let barrierId;
	let metadata;

	beforeEach( () => {

		csrfToken = uuid();
		barrierId = uuid();

		req = {
			barrier: {
				id: barrierId
			},
			csrfToken: () => csrfToken,
			session: {},
			params: {}
		};
		res = {
			render: jasmine.createSpy( 'res.render' ),
			redirect: jasmine.createSpy( 'res.redirect' )
		};
		next = jasmine.createSpy( 'next' );
		backend = {
			barriers: {
				getAll: jasmine.createSpy( 'backend.barriers.getAll' ),
				get: jasmine.createSpy( 'backend.barriers.get' ),
				getInteractions: jasmine.createSpy( 'backend.barriers.getInteractions' ),
				saveNote: jasmine.createSpy( 'backend.barriers.saveNote' ),
				resolve: jasmine.createSpy( 'backend.barriers.resolve' ),
				hibernate: jasmine.createSpy( 'backend.barriers.hibernate' ),
				open: jasmine.createSpy( 'backend.barriers.open' ),
				saveType: jasmine.createSpy( 'backend.barriers.saveType' ),
				saveSectors: jasmine.createSpy( 'backend.barriers.saveSectors' )
			}
		};

		urls = {
			index: jasmine.createSpy( 'urls.index' ),
			barriers: {
				detail: jasmine.createSpy( 'urls.barriers.detail' ),
				interactions: jasmine.createSpy( 'urls.barriers.interactions' ),
				statusResolved: jasmine.createSpy( 'urls.barriers.statusResolved' ),
				statusHibernated: jasmine.createSpy( 'urls.barriers.statusHibernated' ),
				type: {
					list: jasmine.createSpy( 'urls.barriers.type.list' )
				},
				sectors: {
					list: jasmine.createSpy( 'urls.barriers.sectors.list' )
				}
			}
		};

		metadata = {
			barrierTypes: [
				{ id: 1, title: 'barrier 1', category: 'GOODS', description: 'some text' },
				{ id: 2, title: 'barrier 2', category: 'SERVICES', description: 'a bit more text' }
			],
			barrierTypeCategories: {
				'GOODS': 'title 1',
				'SERVICES': 'title 2'
			},
		};

		getValuesResponse = { a: 1, b: 2 };
		getTemplateValuesResponse = { c: 3, d: 4 };
		form = {
			validate: jasmine.createSpy( 'form.validate' ),
			getValues: jasmine.createSpy( 'form.getValues' ).and.callFake( () => getValuesResponse ),
			getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.callFake( () => getTemplateValuesResponse )
		};
		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );
		Form.GROUP = GROUP;
		Form.RADIO = RADIO;

		validators = {
			isDateValue: jasmine.createSpy( 'validators.isDateValue' ),
			isDateValid: ( name ) => jasmine.createSpy( 'validators.isDateValid: ' + name ),
			isDateInPast: jasmine.createSpy( 'validators.isDateInPast' ),
			isMetadata: jasmine.createSpy( 'validators.isMetadata' ),
			isDateNumeric: jasmine.createSpy( 'validators.isDateNumeric' )
		};

		controller = proxyquire( modulePath, {
			'../../../lib/backend-service': backend,
			'../../../lib/urls': urls,
			'../../../lib/Form': Form,
			'../../../lib/validators': validators,
			'../../../lib/metadata': metadata
		} );
	} );

	describe( 'status.index', () => {

		const RESOLVE = 'resolve';
		const HIBERNATE = 'hibernate';
		const OPEN = 'open';
		const TEMPLATE = 'barriers/views/status/index';

		let barrier;
		let dayValidator;
		let monthValidator;
		let yearValidator;
		let detailUrl;

		function checkAndGetConfig(){
			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];

			expect( Form ).toHaveBeenCalled();
			expect( args[ 0 ] ).toEqual( req );

			expect( config.status ).toBeDefined();
			expect( config.status.type ).toEqual( RADIO );
			expect( config.status.values ).toEqual( [ barrier.status ] );
			expect( Array.isArray( config.status.items ) ).toEqual( true );
			expect( typeof config.status.validators[ 0 ].fn ).toEqual( 'function' );

			return config;
		}

		function hasResolveConfig( config ){

			expect( config.resolvedDate ).toBeDefined();
			expect( config.resolvedDate.type ).toEqual( GROUP );
			expect( config.resolvedDate.conditional ).toEqual( { name: 'status', value: RESOLVE } );
			expect( config.resolvedDate.items ).toEqual( { month: {}, year: {} } );
			expect( config.resolvedDate.validators[ 0 ].fn ).toEqual( monthValidator );
			expect( config.resolvedDate.validators[ 1 ].fn ).toEqual( yearValidator );
			expect( config.resolvedDate.validators[ 2 ].fn ).toEqual( validators.isDateNumeric );
			expect( config.resolvedDate.validators[ 3 ].fn ).toEqual( validators.isDateValid );
			expect( config.resolvedDate.validators[ 4 ].fn ).toEqual( validators.isDateInPast );

			expect( config.resolvedSummary ).toBeDefined();
			expect( config.resolvedSummary.conditional ).toEqual( { name: 'status', value: RESOLVE } );
			expect( config.resolvedSummary.required ).toBeDefined();
			expect( config.resolvedSummary.errorField ).toEqual( 'summary' );
		}

		function hasHibernateConfig( config ){

			expect( config.hibernationSummary ).toBeDefined();
			expect( config.hibernationSummary.conditional ).toEqual( { name: 'status', value: HIBERNATE } );
			expect( config.hibernationSummary.required ).toBeDefined();
			expect( config.hibernationSummary.errorField ).toEqual( 'summary' );
		}

		function hasOpenConfig( config ){

			expect( config.reopenSummary ).toBeDefined();
			expect( config.reopenSummary.conditional ).toEqual( { name: 'status', value: OPEN } );
			expect( config.reopenSummary.required ).toBeDefined();
			expect( config.reopenSummary.errorField ).toEqual( 'summary' );
		}

		beforeEach( () => {

			barrier = {
				id: uuid(),
			};
			req.barrier = barrier;

			dayValidator = { day: 1 };
			monthValidator = { month: 1 };
			yearValidator = { year: 1 };

			validators.isDateValue.and.callFake( ( name ) => {

				if( name === 'day' ){ return dayValidator; }
				if( name === 'month' ){ return monthValidator; }
				if( name === 'year' ){ return yearValidator; }
			} );

			detailUrl = '/barrier-detail/';
			urls.barriers.detail.and.callFake( () => detailUrl );
		} );

		describe( 'When the current status is OPEN', () => {

			beforeEach( () => {

				barrier.status = 2;
			} );

			it( 'Should setup the form correctly', () => {

				controller.index( req, res );

				const config = checkAndGetConfig();
				hasResolveConfig( config );
				hasHibernateConfig( config );
			} );

			describe( 'When it is a GET', () => {
				it( 'Should render the view with the viewModel', async () => {

					await controller.index( req, res, next );

					expect( form.validate ).not.toHaveBeenCalled();
					expect( form.getTemplateValues ).toHaveBeenCalledWith();
					expect( res.render ).toHaveBeenCalledWith( TEMPLATE, getTemplateValuesResponse );
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

						await controller.index( req, res, next );

						expect( res.render ).toHaveBeenCalledWith( TEMPLATE, getTemplateValuesResponse );
					} );
				} );

				describe( 'When the required values are filled', () => {
					describe( 'When it is RESOLVE', () => {

						beforeEach( () => {

							getValuesResponse.status = RESOLVE;
						} );

						describe( 'When the response is a success', () => {

							beforeEach( () => {

								backend.barriers.resolve.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );
								form.hasErrors = () => false;
							} );

							afterEach( () => {

								expect( next ).not.toHaveBeenCalled();
								expect( backend.barriers.resolve ).toHaveBeenCalledWith( req, req.barrier.id, getValuesResponse );
							} );

							describe( 'When the form is saved', () => {
								it( 'Should redirect', async () => {

									await controller.index( req, res, next );

									expect( urls.barriers.detail ).toHaveBeenCalledWith( req.barrier.id );
									expect( res.redirect ).toHaveBeenCalledWith( detailUrl );
								} );
							} );
						} );

						describe( 'When the response is not a success', () => {
							describe( 'When the error is a 400', () => {

								let statusCode;
								let fields;

								beforeEach( () => {

									statusCode = 400;
									fields = { a: 1, b: 2 };

									backend.barriers.resolve.and.callFake( () => Promise.resolve( {
										response: { isSuccess: false, statusCode },
										body: { fields }
									} ) );

									form.addErrors = jasmine.createSpy( 'form.addErrors' );
								} );

								describe( 'When the fields match', () => {
									it( 'Should call form.addErrors and render the page', async () => {


										form.hasErrors = () => false;
										form.addErrors.and.callFake( () => {
											form.hasErrors = () => true;
										} );

										await controller.index( req, res, next );

										expect( form.addErrors ).toHaveBeenCalledWith( fields );
										expect( res.render ).toHaveBeenCalledWith( TEMPLATE, getTemplateValuesResponse );
									} );
								} );

								describe( 'When the fields do not match', () => {
									it( 'Should call next with an error', async () => {

										form.hasErrors = () => false;

										await controller.index( req, res, next );

										expect( next ).toHaveBeenCalledWith( new Error( 'No errors in response body, form not saved - got 400 from backend' ) );
									} );
								} );
							} );

							describe( 'When it is a unknown error', () => {
								it( 'Should call next with an error', async () => {

									const statusCode = 500;
									form.hasErrors = () => false;
									backend.barriers.resolve.and.callFake( () => Promise.resolve( {
										response: { isSuccess: false, statusCode }
									} ) );

									await controller.index( req, res, next );

									expect( next ).toHaveBeenCalledWith( new Error( 'Unable to save form - got 500 from backend' ) );
								} );
							} );
						} );

						describe( 'When the request fails', () => {
							it( 'Should call next with the error', async () => {

								const err = new Error( 'my test' );
								form.hasErrors = () => false;
								backend.barriers.resolve.and.callFake( () => Promise.reject( err ) );

								await controller.index( req, res, next );

								expect( next ).toHaveBeenCalledWith( err );
							} );
						} );
					} );

					describe( 'When it is HIBERNATE', () => {

						beforeEach( () => {

							getValuesResponse.status = HIBERNATE;
						} );

						describe( 'When the response is a success', () => {

							beforeEach( () => {

								backend.barriers.hibernate.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );
								form.hasErrors = () => false;
							} );

							afterEach( () => {

								expect( next ).not.toHaveBeenCalled();
								expect( backend.barriers.hibernate ).toHaveBeenCalledWith( req, req.barrier.id, getValuesResponse );
							} );

							describe( 'When the form is saved', () => {
								it( 'Should redirect', async () => {

									await controller.index( req, res, next );

									expect( urls.barriers.detail ).toHaveBeenCalledWith( req.barrier.id );
									expect( res.redirect ).toHaveBeenCalledWith( detailUrl );
								} );
							} );
						} );

						describe( 'When the response is not a success', () => {
							describe( 'When the error is a 400', () => {

								let statusCode;
								let fields;

								beforeEach( () => {

									statusCode = 400;
									fields = { a: 1, b: 2 };

									backend.barriers.hibernate.and.callFake( () => Promise.resolve( {
										response: { isSuccess: false, statusCode },
										body: { fields }
									} ) );

									form.addErrors = jasmine.createSpy( 'form.addErrors' );
								} );

								describe( 'When the fields match', () => {
									it( 'Should call form.addErrors and render the page', async () => {


										form.hasErrors = () => false;
										form.addErrors.and.callFake( () => {
											form.hasErrors = () => true;
										} );

										await controller.index( req, res, next );

										expect( form.addErrors ).toHaveBeenCalledWith( fields );
										expect( res.render ).toHaveBeenCalledWith( TEMPLATE, getTemplateValuesResponse );
									} );
								} );

								describe( 'When the fields do not match', () => {
									it( 'Should call next with an error', async () => {

										form.hasErrors = () => false;

										await controller.index( req, res, next );

										expect( next ).toHaveBeenCalledWith( new Error( 'No errors in response body, form not saved - got 400 from backend' ) );
									} );
								} );
							} );

							describe( 'When it is a unknown error', () => {
								it( 'Should call next with an error', async () => {

									const statusCode = 500;
									form.hasErrors = () => false;
									backend.barriers.hibernate.and.callFake( () => Promise.resolve( {
										response: { isSuccess: false, statusCode }
									} ) );

									await controller.index( req, res, next );

									expect( next ).toHaveBeenCalledWith( new Error( 'Unable to save form - got 500 from backend' ) );
								} );
							} );
						} );

						describe( 'When the request fails', () => {
							it( 'Should call next with the error', async () => {

								const err = new Error( 'my test' );
								form.hasErrors = () => false;
								backend.barriers.hibernate.and.callFake( () => Promise.reject( err ) );

								await controller.index( req, res, next );

								expect( next ).toHaveBeenCalledWith( err );
							} );
						} );
					} );
				} );
			} );
		} );

		describe( 'When the current status is RESOLVE', () => {

			beforeEach( () => {

				barrier.status = 4;
			} );

			it( 'Should setup the form correctly', () => {

				controller.index( req, res );

				const config = checkAndGetConfig();

				hasOpenConfig( config );
				hasHibernateConfig( config );
			} );

			describe( 'When it is a POST', () => {

				beforeEach( () => {

					req.body = {};
					form.isPost = true;
				} );

				afterEach( () => {

					expect( form.validate ).toHaveBeenCalled();
				} );

				describe( 'When the required values are filled', () => {
					describe( 'When it is OPEN', () => {

						beforeEach( () => {

							getValuesResponse.status = OPEN;
						} );

						describe( 'When the response is a success', () => {

							beforeEach( () => {

								backend.barriers.open.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );
								form.hasErrors = () => false;
							} );

							afterEach( () => {

								expect( next ).not.toHaveBeenCalled();
								expect( backend.barriers.open ).toHaveBeenCalledWith( req, req.barrier.id, getValuesResponse );
							} );

							describe( 'When the form is saved', () => {
								it( 'Should redirect', async () => {

									await controller.index( req, res, next );

									expect( urls.barriers.detail ).toHaveBeenCalledWith( req.barrier.id );
									expect( res.redirect ).toHaveBeenCalledWith( detailUrl );
								} );
							} );
						} );
					} );
				} );
			} );
		} );

		describe( 'When the current status is HIBERNATE', () => {

			beforeEach( () => {

				barrier.status = 5;
			} );

			it( 'Should setup the form correctly', () => {

				controller.index( req, res );

				const config = checkAndGetConfig();

				hasOpenConfig( config );
				hasResolveConfig( config );
			} );
		} );
	} );
} );
