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
				hibernate: jasmine.createSpy( 'backend.barriers.hibernate' )
			}
		};

		urls = {
			index: jasmine.createSpy( 'urls.index' ),
			barriers: {
				detail: jasmine.createSpy( 'urls.barriers.detail' ),
				interactions: jasmine.createSpy( 'urls.barriers.interactions' ),
				statusResolved: jasmine.createSpy( 'urls.barriers.statusResolved' ),
				statusHibernated: jasmine.createSpy( 'urls.barriers.statusHibernated' )
			}
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
			isDateInPast: jasmine.createSpy( 'validators.isDateInPast' )
		};

		controller = proxyquire( modulePath, {
			'../../lib/backend-service': backend,
			'../../lib/urls': urls,
			'../../lib/Form': Form,
			'../../lib/validators': validators,
			'./view-models/detail': barrierDetailViewModel,
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

			expect( config._csrf ).toBeDefined();
			expect( config._csrf.values ).toEqual( [ csrfToken ] );

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

						expect( next ).toHaveBeenCalledWith( new Error( `Unable to save barrier note, got ${ statusCode } from backend` ) );
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
		const TEMPLATE = 'barriers/views/status';

		let barrier;

		beforeEach( () => {

			barrier = {
				id: uuid(),
				current_status: {
					status: 4
				}
			};
			req.barrier = barrier;
		} );

		it( 'Should setup the form correctly', () => {

			const dayValidator = { day: 1 };
			const monthValidator = { month: 1 };
			const yearValidator = { year: 1 };

			validators.isDateValue.and.callFake( ( name ) => {

				if( name === 'day' ){ return dayValidator; }
				if( name === 'month' ){ return monthValidator; }
				if( name === 'year' ){ return yearValidator; }
			} );

			controller.status( req, res );

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];

			expect( Form ).toHaveBeenCalled();
			expect( args[ 0 ] ).toEqual( req );

			expect( config._csrf ).toBeDefined();
			expect( config._csrf.values ).toEqual( [ csrfToken ] );

			expect( config.status ).toBeDefined();
			expect( config.status.values ).toEqual( [ barrier.current_status.status ] );
			expect( Array.isArray( config.status.items ) ).toEqual( true );
			expect( typeof config.status.validators[ 0 ].fn ).toEqual( 'function' );

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

			expect( config.hibernationSummary ).toBeDefined();
			expect( config.hibernationSummary.conditional ).toEqual( { name: 'status', value: HIBERNATE } );
			expect( config.hibernationSummary.required ).toBeDefined();
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
				describe( 'When it is resolve', () => {

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

									expect( next ).toHaveBeenCalledWith( new Error( `Unable to save barrier status, got ${ statusCode } from backend` ) );
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

								expect( next ).toHaveBeenCalledWith( new Error( `Unable to save barrier status, got ${ statusCode } from backend` ) );
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
} );
