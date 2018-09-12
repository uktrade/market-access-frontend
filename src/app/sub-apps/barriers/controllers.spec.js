const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

const modulePath = './controllers';

const GROUP = 'group';

describe( 'Barriers controller', () => {

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
	let barrierDetailViewModel;
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
				saveType: jasmine.createSpy( 'backend.barriers.saveType' )
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
				}
			}
		};

		metadata = {
			barrierTypes: [
				{ id: 1, title: 'barrier 1', category: 'GOODS' },
				{ id: 2, title: 'barrier 2', category: 'SERVICES' }
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
		barrierDetailViewModel = jasmine.createSpy( 'barrierDetailViewModel' );

		validators = {
			isDateValue: jasmine.createSpy( 'validators.isDateValue' ),
			isDateValid: ( name ) => jasmine.createSpy( 'validators.isDateValid: ' + name ),
			isDateInPast: jasmine.createSpy( 'validators.isDateInPast' ),
			isMetadata: jasmine.createSpy( 'validators.metadata' )
		};

		controller = proxyquire( modulePath, {
			'../../lib/backend-service': backend,
			'../../lib/urls': urls,
			'../../lib/Form': Form,
			'../../lib/validators': validators,
			'./view-models/detail': barrierDetailViewModel,
			'../../lib/metadata': metadata
		} );
	} );

	describe( 'interactions', () => {
		describe( 'Without an error', () => {
			describe( 'With a success response', () => {
				it( 'Should get the barriers and render the index page', async () => {

					const interactionsResponse = {
						response: { isSuccess: true  },
						body: {
							results: [ { id: 1 } ]
						}
					};
					const barrierDetailViewModelResponse = { barriers: true };

					barrierDetailViewModel.and.callFake( () => barrierDetailViewModelResponse );
					backend.barriers.getInteractions.and.callFake( () => Promise.resolve( interactionsResponse ) );

					await controller.interactions( req, res, next );

					expect( next ).not.toHaveBeenCalled();
					expect( backend.barriers.getInteractions ).toHaveBeenCalledWith( req, barrierId );
					expect( barrierDetailViewModel ).toHaveBeenCalledWith( req.barrier );
					expect( res.render ).toHaveBeenCalledWith( 'barriers/views/interactions', Object.assign(
						barrierDetailViewModelResponse,
						{ interactions: interactionsResponse }
					) );
				} );
			} );

			describe( 'Without a success response', () => {
				it( 'Should get the barriers and render the interactions page', async () => {

					const interactionsResponse = {
						response: { isSuccess: false, statusCode: 500 },
						body: {}
					};

					backend.barriers.getInteractions.and.callFake( () => Promise.resolve( interactionsResponse ) );

					await controller.interactions( req, res, next );

					expect( next ).toHaveBeenCalledWith( new Error( `Unable to get interactions, got ${ interactionsResponse.response.statusCode } response from backend` ) );
					expect( backend.barriers.getInteractions ).toHaveBeenCalledWith( req, req.barrier.id );
					expect( res.render ).not.toHaveBeenCalled();
				} );
			} );
		} );

		describe( 'With an error', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'issue with backend' );

				backend.barriers.getInteractions.and.callFake( () => Promise.reject( err ) );

				await controller.interactions( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
			} );
		} );
	} );

	describe( 'Barrier', () => {
		it( 'Should render the barrier detail page', () => {

			const barierDetailViewModelResponse = { a: 1, b: 2 };

			barrierDetailViewModel.and.callFake( () => barierDetailViewModelResponse );

			controller.barrier( req, res );

			expect( barrierDetailViewModel ).toHaveBeenCalledWith( req.barrier );
			expect( res.render ).toHaveBeenCalledWith( 'barriers/views/detail', barierDetailViewModelResponse );
		} );
	} );

	describe( 'addNote', () => {
		it( 'Should setup the form correctly', () => {

			controller.addNote( req, res, next );

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];

			expect( Form ).toHaveBeenCalled();
			expect( args[ 0 ] ).toEqual( req );

			expect( config.note ).toBeDefined();
			expect( config.note.required ).toBeDefined();

			expect( config.pinned ).toBeDefined();
		} );

		describe( 'When it is a POST', () => {

			beforeEach( () => {

				req.body = {};
				form.isPost = true;
			} );

			describe( 'When the input values are valid', () => {
				describe( 'When the response is a success', () => {

					beforeEach( () => {

						backend.barriers.saveNote.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );
						form.hasErrors = () => false;
					} );

					afterEach( () => {

						expect( next ).not.toHaveBeenCalled();
						expect( backend.barriers.saveNote ).toHaveBeenCalledWith( req, req.barrier.id, getValuesResponse );
					} );

					describe( 'When the form is saved', () => {
						it( 'Should redirect', async () => {

							const interactionsUrl = '/interactions/';
							urls.barriers.interactions.and.callFake( () => interactionsUrl );

							await controller.addNote( req, res, next );

							expect( form.validate ).toHaveBeenCalled();
							expect( urls.barriers.interactions ).toHaveBeenCalledWith( req.barrier.id );
							expect( res.redirect ).toHaveBeenCalledWith( interactionsUrl );
						} );
					} );
				} );

				describe( 'When the response is not a success', () => {
					it( 'Should call next with an error', async () => {

						const statusCode = 500;
						form.hasErrors = () => false;
						backend.barriers.saveNote.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

						await controller.addNote( req, res, next );

						expect( next ).toHaveBeenCalledWith( new Error( 'Unable to save form - got 500 from backend' ) );
					} );
				} );

				describe( 'When the request fails', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'my test' );
						form.hasErrors = () => false;
						backend.barriers.saveNote.and.callFake( () => Promise.reject( err ) );

						await controller.addNote( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
					} );
				} );
			} );

			describe( 'When the input values are invalid', () => {
				it( 'Should render the page', async () => {

					const barrierDetailViewModelResponse = { a: 1 };
					const interactionsResponse = { response: { isSuccess: true }, body: { results: [ { b: 2 } ] } };

					barrierDetailViewModel.and.callFake( () => barrierDetailViewModelResponse );
					backend.barriers.getInteractions.and.callFake( () => interactionsResponse );

					form.isPost = true;
					form.hasErrors = () => true;

					await controller.addNote( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( 'barriers/views/interactions', Object.assign(
						barrierDetailViewModelResponse,
						{ interactions: interactionsResponse },
						getTemplateValuesResponse
					) );
					expect( barrierDetailViewModel ).toHaveBeenCalledWith( req.barrier );
					expect( next ).not.toHaveBeenCalled();
				} );
			} );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the interactions page with the form', async () => {

				//req.barrier = { id: 1, test: 2 };

				const interactionsResponse = {
					response: { isSuccess: true },
					body: { results: [] }
				};
				const barierDetailViewModelResponse = { a: 1, b: 2 };

				barrierDetailViewModel.and.callFake( () => barierDetailViewModelResponse );
				backend.barriers.getInteractions.and.callFake( () => interactionsResponse );

				await controller.addNote( req, res, next );

				expect( form.getTemplateValues ).toHaveBeenCalledWith();
				expect( res.render ).toHaveBeenCalledWith( 'barriers/views/interactions', Object.assign(
					barierDetailViewModelResponse,
					{ interactions: interactionsResponse },
					{ noteForm: true },
					getTemplateValuesResponse
				) );
			} );
		} );
	} );

	describe( 'status', () => {

		const RESOLVE = 'resolve';
		const HIBERNATE = 'hibernate';
		const OPEN = 'open';
		const TEMPLATE = 'barriers/views/status';

		let barrier;
		let dayValidator;
		let monthValidator;
		let yearValidator;

		function checkAndGetConfig(){
			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];

			expect( Form ).toHaveBeenCalled();
			expect( args[ 0 ] ).toEqual( req );

			expect( config.status ).toBeDefined();
			expect( config.status.values ).toEqual( [ barrier.current_status.status ] );
			expect( Array.isArray( config.status.items ) ).toEqual( true );
			expect( typeof config.status.validators[ 0 ].fn ).toEqual( 'function' );

			return config;
		}

		function hasResolveConfig( config ){

			expect( config.resolvedDate ).toBeDefined();
			expect( config.resolvedDate.type ).toEqual( GROUP );
			expect( config.resolvedDate.conditional ).toEqual( { name: 'status', value: RESOLVE } );
			expect( config.resolvedDate.items ).toEqual( { day: {}, month: {}, year: {} } );
			expect( config.resolvedDate.validators[ 0 ].fn ).toEqual( dayValidator );
			expect( config.resolvedDate.validators[ 1 ].fn ).toEqual( monthValidator );
			expect( config.resolvedDate.validators[ 2 ].fn ).toEqual( yearValidator );
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
				current_status: {}
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
		} );

		describe( 'When the current status is OPEN', () => {

			beforeEach( () => {

				barrier.current_status.status = 2;
			} );

			it( 'Should setup the form correctly', () => {

				controller.status( req, res );

				const config = checkAndGetConfig();
				hasResolveConfig( config );
				hasHibernateConfig( config );
			} );

			describe( 'When it is a GET', () => {
				it( 'Should render the view with the viewModel', async () => {

					await controller.status( req, res, next );

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

						await controller.status( req, res, next );

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

									const resolvedlUrl = '/resolved/';
									urls.barriers.statusResolved.and.callFake( () => resolvedlUrl );

									await controller.status( req, res, next );

									expect( urls.barriers.statusResolved ).toHaveBeenCalledWith( req.barrier.id );
									expect( res.redirect ).toHaveBeenCalledWith( resolvedlUrl );
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

										await controller.status( req, res, next );

										expect( form.addErrors ).toHaveBeenCalledWith( fields );
										expect( res.render ).toHaveBeenCalledWith( TEMPLATE, getTemplateValuesResponse );
									} );
								} );

								describe( 'When the fields do not match', () => {
									it( 'Should call next with an error', async () => {

										form.hasErrors = () => false;

										await controller.status( req, res, next );

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

									await controller.status( req, res, next );

									expect( next ).toHaveBeenCalledWith( new Error( 'Unable to save form - got 500 from backend' ) );
								} );
							} );
						} );

						describe( 'When the request fails', () => {
							it( 'Should call next with the error', async () => {

								const err = new Error( 'my test' );
								form.hasErrors = () => false;
								backend.barriers.resolve.and.callFake( () => Promise.reject( err ) );

								await controller.status( req, res, next );

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

									const hibernatelUrl = '/resolved/';
									urls.barriers.statusHibernated.and.callFake( () => hibernatelUrl );

									await controller.status( req, res, next );

									expect( urls.barriers.statusHibernated ).toHaveBeenCalledWith( req.barrier.id );
									expect( res.redirect ).toHaveBeenCalledWith( hibernatelUrl );
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

										await controller.status( req, res, next );

										expect( form.addErrors ).toHaveBeenCalledWith( fields );
										expect( res.render ).toHaveBeenCalledWith( TEMPLATE, getTemplateValuesResponse );
									} );
								} );

								describe( 'When the fields do not match', () => {
									it( 'Should call next with an error', async () => {

										form.hasErrors = () => false;

										await controller.status( req, res, next );

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

									await controller.status( req, res, next );

									expect( next ).toHaveBeenCalledWith( new Error( 'Unable to save form - got 500 from backend' ) );
								} );
							} );
						} );

						describe( 'When the request fails', () => {
							it( 'Should call next with the error', async () => {

								const err = new Error( 'my test' );
								form.hasErrors = () => false;
								backend.barriers.hibernate.and.callFake( () => Promise.reject( err ) );

								await controller.status( req, res, next );

								expect( next ).toHaveBeenCalledWith( err );
							} );
						} );
					} );
				} );
			} );
		} );

		describe( 'When the current status is RESOLVE', () => {

			beforeEach( () => {

				barrier.current_status.status = 4;
			} );

			it( 'Should setup the form correctly', () => {

				controller.status( req, res );

				const config = checkAndGetConfig();

				hasOpenConfig( config );
				hasHibernateConfig( config );
			} );
		} );

		describe( 'When the current status is HIBERNATE', () => {

			beforeEach( () => {

				barrier.current_status.status = 5;
			} );

			it( 'Should setup the form correctly', () => {

				controller.status( req, res );

				const config = checkAndGetConfig();

				hasOpenConfig( config );
				hasResolveConfig( config );
			} );
		} );
	} );

	describe( 'statusResolved', () => {
		it( 'Should render the success page', () => {

			req.uuid = 'test';

			controller.statusResolved( req, res );

			expect( res.render ).toHaveBeenCalledWith( 'barriers/views/status-resolved', { barrierId: req.uuid } );
		} );
	} );

	describe( 'statusHibernated', () => {
		it( 'Should render the success page', () => {

			req.uuid = 'test';

			controller.statusHibernated( req, res );

			expect( res.render ).toHaveBeenCalledWith( 'barriers/views/status-hibernated', { barrierId: req.uuid } );
		} );
	} );

	describe( 'type.category', () => {

		let ssoToken;
		let report;

		beforeEach( () => {

			ssoToken = uuid();
			req.session = { ssoToken };
			report = {
				id: 123,
				barrier_type_category: 'barrier_type_category'
			};
			req.report = report;
		} );

		describe( 'form setup', () => {

			const barrierTypeCategories = { barrierTypeCategories: 1 };

			beforeEach( () => {

				validators.isMetadata.and.callFake( () => barrierTypeCategories );
			} );

			afterEach( () => {

				const args = Form.calls.argsFor( 0 );
				const config = args[ 1 ];

				expect( Form ).toHaveBeenCalled();
				expect( args[ 0 ] ).toEqual( req );

				expect( config.category ).toBeDefined();
				expect( config.category.type ).toEqual( Form.RADIO );
				expect( config.category.items.length ).toEqual( Object.entries( metadata.barrierTypeCategories ).length );
				expect( config.category.validators[ 0 ].fn ).toEqual( barrierTypeCategories );
			} );

			describe( 'When there is not a barrier', () => {
				it( 'Should setup the form correctly', () => {

					controller.type.category( req, res );

					const config = Form.calls.argsFor( 0 )[ 1 ];

					expect( config.category.values ).toEqual( [] );
				} );
			} );

			describe( 'When there is not a barrier', () => {
				it( 'Should setup the form correctly', () => {

					const barrier = {
						barrier_type: {
							category: 'abc-123'
						}
					};

					req.barrier = barrier;

					controller.type.category( req, res );

					const config = Form.calls.argsFor( 0 )[ 1 ];
					expect( config.category.values ).toEqual( [ barrier.barrier_type.category ] );

				} );
			} );
		} );

		describe( 'When it is a POST', () => {

			beforeEach( () => {

				req.method = 'POST';
				req.body = {};
				form.isPost = true;
			} );

			describe( 'When the input values are valid', () => {

				it( 'Should save the values and redirect to the next step', () => {

					const listUrl = 'my-url';
					const category = '123';

					req.body = { category };
					getValuesResponse = { category };
					form.hasErrors = () => false;

					urls.barriers.type.list.and.callFake( () => listUrl );

					controller.type.category( req, res );

					expect( form.validate ).toHaveBeenCalled();
					expect( urls.barriers.type.list ).toHaveBeenCalledWith( barrierId, category );
					expect( res.redirect ).toHaveBeenCalledWith( listUrl );
				} );
			} );

			describe( 'When no input values are given', () => {

				beforeEach( () => {

					form.hasErrors = () => true;
				} );

				it( 'Should render the template with the form values', () => {

					controller.type.category( req, res );
					expect( res.render ).toHaveBeenCalledWith( 'barriers/views/type-category', getTemplateValuesResponse );
				} );
			} );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the template with the form values', () => {

				const sessionValues = { category: 'GOODS' };

				req.session.typeCategoryValues = sessionValues;

				controller.type.category( req, res );

				expect( form.getTemplateValues ).toHaveBeenCalledWith();
				expect( res.render ).toHaveBeenCalledWith( 'barriers/views/type-category', getTemplateValuesResponse );
			} );
		} );
	} );

	describe( 'type.list', () => {

		let barrier;
		let templateData;
		let category;

		beforeEach( () => {

			barrier = {
				id: 123,
				barrier_type: { id: 456 }
			};

			category = 'GOODS';

			req.barrier = barrier;
			req.category = category;

			getTemplateValuesResponse = {
				barrierType: [
					{ value: 1, text: 'barrier 1', category: 'GOODS' },
					{ value: 2, text: 'barrier 2', category: 'SERVICES' }
				]
			};

			templateData = Object.assign(
				getTemplateValuesResponse,
				{ title: metadata.barrierTypeCategories.GOODS }
			);
		} );

		it( 'Should setup the form correctly', async () => {

			await controller.type.list( req, res, next );

			expect( Form ).toHaveBeenCalled();

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];
			const goodsBarrierType = metadata.barrierTypes[ 0 ];

			expect( args[ 0 ] ).toEqual( req );

			expect( config.barrierType ).toBeDefined();
			expect( config.barrierType.type ).toEqual( Form.RADIO );
			expect( config.barrierType.items ).toEqual( [{
				value: goodsBarrierType.id,
				text: goodsBarrierType.title,
				category: goodsBarrierType.category
			}] );
			expect( config.barrierType.values ).toEqual( [ barrier.barrier_type.id ] );
			expect( config.barrierType.validators[ 0 ].fn ).toEqual( validators.isBarrierType );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the view with the viewModel', async () => {

				await controller.type.list( req, res, next );

				expect( form.validate ).not.toHaveBeenCalled();
				expect( form.getTemplateValues ).toHaveBeenCalledWith();
				expect( res.render ).toHaveBeenCalledWith( 'barriers/views/type', templateData );
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

					await controller.type.list( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( 'barriers/views/type', templateData );
				} );
			} );

			describe( 'When the required values are filled', () => {
				describe( 'When the response is a success', () => {

					beforeEach( () => {

						backend.barriers.saveType.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );

						req.barrier = { id: 1, b: 2 };
						form.hasErrors = () => false;
					} );

					afterEach( () => {

						expect( next ).not.toHaveBeenCalled();
						expect( req.session.typeCategoryValues ).not.toBeDefined();
						expect( backend.barriers.saveType ).toHaveBeenCalledWith( req, req.barrier.id, getValuesResponse );
					} );

					describe( 'When save and exit is used to submit the form', () => {
						it( 'Should redirect to the barrier detail page', async () => {

							const barrierDetailResponse = '/barrierDetail';
							urls.barriers.detail.and.callFake( () => barrierDetailResponse );
							form.isExit = true;

							await controller.type.list( req, res, next );

							expect( urls.barriers.detail ).toHaveBeenCalledWith( req.barrier.id );
							expect( res.redirect ).toHaveBeenCalledWith( barrierDetailResponse );
						} );
					} );

					describe( 'When save and continue is used to submit the form', () => {
						it( 'Should redirect', async () => {

							const detailResponse = '/detail/';
							urls.barriers.detail.and.callFake( () => detailResponse );

							await controller.type.list( req, res, next );

							expect( urls.barriers.detail ).toHaveBeenCalledWith( req.barrier.id );
							expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
						} );
					} );
				} );

				describe( 'When the response is not a success', () => {
					it( 'Should call next with an error', async () => {

						const statusCode = 500;
						form.hasErrors = () => false;
						backend.barriers.saveType.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

						await controller.type.list( req, res, next );

						expect( next ).toHaveBeenCalledWith( new Error( 'Unable to save form - got 500 from backend' ) );
					} );
				} );

				describe( 'When the request fails', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'my test' );
						form.hasErrors = () => false;
						backend.barriers.saveType.and.callFake( () => Promise.reject( err ) );

						await controller.type.list( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
					} );
				} );
			} );
		} );
	} );
} );
