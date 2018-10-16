const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

const modulePath = './interactions';

describe( 'Barrier interactions controller', () => {

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
				getInteractions: jasmine.createSpy( 'backend.barriers.getInteractions' ),
				saveNote: jasmine.createSpy( 'backend.barriers.saveNote' ),
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

		getValuesResponse = { a: 1, b: 2 };
		getTemplateValuesResponse = { c: 3, d: 4 };
		form = {
			validate: jasmine.createSpy( 'form.validate' ),
			getValues: jasmine.createSpy( 'form.getValues' ).and.callFake( () => getValuesResponse ),
			getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.callFake( () => getTemplateValuesResponse )
		};
		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );
		barrierDetailViewModel = jasmine.createSpy( 'barrierDetailViewModel' );

		validators = {
			isDateValue: jasmine.createSpy( 'validators.isDateValue' ),
			isDateValid: ( name ) => jasmine.createSpy( 'validators.isDateValid: ' + name ),
			isDateInPast: jasmine.createSpy( 'validators.isDateInPast' ),
			isMetadata: jasmine.createSpy( 'validators.isMetadata' ),
			isSector: jasmine.createSpy( 'validators.isSector' ),
			isDateNumeric: jasmine.createSpy( 'validators.isDateNumeric' )
		};

		controller = proxyquire( modulePath, {
			'../../../lib/backend-service': backend,
			'../../../lib/urls': urls,
			'../../../lib/Form': Form,
			'../../../lib/validators': validators,
			'../view-models/detail': barrierDetailViewModel,
		} );
	} );

	describe( 'list', () => {
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

					await controller.list( req, res, next );

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

					await controller.list( req, res, next );

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

				await controller.list( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
			} );
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

} );