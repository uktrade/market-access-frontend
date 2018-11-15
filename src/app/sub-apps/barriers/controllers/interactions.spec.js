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
				notes: {
					save: jasmine.createSpy( 'backend.barriers.notes.save' ),
					update: jasmine.createSpy( 'backend.barriers.notes.update' ),
				}
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
			isNumeric: jasmine.createSpy( 'validators.isNumeric' ),
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

					const results = [
						{ id: 1, text: 'one', pinned: false, created_on: 'Tue Sep 11 2018 06:16:40 GMT+0100 (BST)' },
						{ id: 2, text: 'two', pinned: true, created_on: 'Fri Jun 01 2018 01:43:07 GMT+0100 (BST)' },
						{ id: 3, text: 'three', pinned: false, created_on: 'Wed Nov 22 2017 10:45:25 GMT+0000 (GMT)' },
						{ id: 4, text: 'four', pinned: true, created_on: 'Fri Dec 08 2017 08:25:17 GMT+0000 (GMT)' },
						{ id: 5, text: 'five', pinned: true, created_on: 'Fri Dec 08 2017 08:25:17 GMT+0000 (GMT)' },
					];
					const interactionsResponse = {
						response: { isSuccess: true  },
						body: { results }
					};
					const barrierDetailViewModelResponse = { barrier: true };

					barrierDetailViewModel.and.callFake( () => barrierDetailViewModelResponse );
					backend.barriers.getInteractions.and.callFake( () => Promise.resolve( interactionsResponse ) );

					await controller.list( req, res, next );

					expect( next ).not.toHaveBeenCalled();
					expect( backend.barriers.getInteractions ).toHaveBeenCalledWith( req, barrierId );
					expect( barrierDetailViewModel ).toHaveBeenCalledWith( req.barrier );

					// For some reason .toHaveBeenCalledWith() does not match the interations,
					// once they have been sorted, so have to check each property individually
					const renderArgs = res.render.calls.argsFor( 0 );

					expect( renderArgs[ 0 ] ).toEqual( 'barriers/views/interactions' );
					expect( renderArgs[ 1 ].barrier ).toBeDefined();
					//separate pinned and non pinned
					//expect( renderArgs[ 1 ].interactions ).toEqual( [ results[ 1 ], results[ 3 ], results[ 4 ], results[ 0 ], results[ 2 ] ] );
					//one list
					expect( renderArgs[ 1 ].interactions ).toEqual( [ results[ 0 ], results[ 1 ], results[ 3 ], results[ 4 ], results[ 2 ] ] );
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

	describe( 'notes', () => {
		describe( 'add', () => {
			it( 'Should setup the form correctly', () => {

				controller.notes.add( req, res, next );

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

							backend.barriers.notes.save.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );
							form.hasErrors = () => false;
						} );

						afterEach( () => {

							expect( next ).not.toHaveBeenCalled();
							expect( backend.barriers.notes.save ).toHaveBeenCalledWith( req, req.barrier.id, getValuesResponse );
						} );

						describe( 'When the form is saved', () => {
							it( 'Should redirect', async () => {

								const interactionsUrl = '/interactions/';
								urls.barriers.interactions.and.callFake( () => interactionsUrl );

								await controller.notes.add( req, res, next );

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
							backend.barriers.notes.save.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

							await controller.notes.add( req, res, next );

							expect( next ).toHaveBeenCalledWith( new Error( 'Unable to save form - got 500 from backend' ) );
						} );
					} );

					describe( 'When the request fails', () => {
						it( 'Should call next with the error', async () => {

							const err = new Error( 'my test' );
							form.hasErrors = () => false;
							backend.barriers.notes.save.and.callFake( () => Promise.reject( err ) );

							await controller.notes.add( req, res, next );

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

						await controller.notes.add( req, res, next );

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

					await controller.notes.add( req, res, next );

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

		describe( 'edit', () => {
			describe( 'When the noteId is invalid', () => {
				it( 'Should call next with an error', async () => {

					req.params.noteId = 'abc';

					await controller.notes.edit( req, res, next );

					expect( next ).toHaveBeenCalledWith( new Error( 'Invalid noteId' ) );
					expect( res.render ).not.toHaveBeenCalled();
				} );
			} );

			describe( 'When the noteId is valid', () => {

				let editId;

				beforeEach( () => {

					editId = 34;
					req.params.noteId = editId;
					validators.isNumeric.and.callFake( () => true );
				} );

				it( 'Should setup the form correctly', () => {

					controller.notes.edit( req, res, next );

					const args = Form.calls.argsFor( 0 );
					const config = args[ 1 ];

					expect( Form ).toHaveBeenCalled();
					expect( args[ 0 ] ).toEqual( req );

					expect( config.note ).toBeDefined();
					expect( config.note.required ).toBeDefined();
				} );

				describe( 'When it is a POST', () => {

					beforeEach( () => {

						req.body = {};
						form.isPost = true;
					} );


					describe( 'When the input values are valid', () => {
						describe( 'When the response is a success', () => {

							beforeEach( () => {

								backend.barriers.notes.update.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );
								form.hasErrors = () => false;
							} );

							afterEach( () => {

								expect( next ).not.toHaveBeenCalled();
								expect( backend.barriers.notes.update ).toHaveBeenCalledWith( req, editId, getValuesResponse );
							} );

							describe( 'When the form is saved', () => {
								it( 'Should redirect', async () => {

									const interactionsUrl = '/interactions/';
									urls.barriers.interactions.and.callFake( () => interactionsUrl );

									await controller.notes.edit( req, res, next );

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
								backend.barriers.notes.update.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

								await controller.notes.edit( req, res, next );

								expect( next ).toHaveBeenCalledWith( new Error( 'Unable to save form - got 500 from backend' ) );
							} );
						} );

						describe( 'When the request fails', () => {
							it( 'Should call next with the error', async () => {

								const err = new Error( 'my test' );
								form.hasErrors = () => false;
								backend.barriers.notes.update.and.callFake( () => Promise.reject( err ) );

								await controller.notes.edit( req, res, next );

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

							await controller.notes.edit( req, res, next );

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

						const interactionsResponse = {
							response: { isSuccess: true },
							body: { results: [
								{ id: 1, text: 'one', created_on: 'Tue Sep 11 2018 06:16:40 GMT+0100 (BST)' },
								{ id: editId, text: 'edit item', created_on: 'Wed Nov 22 2017 10:45:25 GMT+0000 (GMT)' }
							] }
						};
						const barierDetailViewModelResponse = { a: 1, b: 2 };
						const expectedInteractions = interactionsResponse.body.results.map( ( item ) => {

							const newItem = Object.assign( {}, item );

							if( item.id == editId ){

								newItem.edit = true;
							}

							return newItem;
						} );

						barrierDetailViewModel.and.callFake( () => Object.assign( {}, barierDetailViewModelResponse ) );
						backend.barriers.getInteractions.and.callFake( () => interactionsResponse );

						await controller.notes.edit( req, res, next );

						expect( form.getTemplateValues ).toHaveBeenCalledWith();
						expect( res.render ).toHaveBeenCalledWith( 'barriers/views/interactions', Object.assign( {},
							barierDetailViewModelResponse,
							{ interactions: expectedInteractions },
							getTemplateValuesResponse,
						) );
					} );
				} );
			} );
		} );
	} );
} );
