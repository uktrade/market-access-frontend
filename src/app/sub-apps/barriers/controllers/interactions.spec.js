const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const faker = require( 'faker' );

const modulePath = './interactions';
const getFakeData = jasmine.helpers.getFakeData;

describe( 'Barrier interactions controller', () => {

	let controller;
	let req;
	let res;
	let next;
	let backend;
	let urls;
	let csrfToken;
	let Form;
	let FormProcessor;
	let form;
	let processor;
	let getValuesResponse;
	let getTemplateValuesResponse;
	let validators;
	let barrierDetailViewModel;
	let interactionsViewModel;
	let barrierId;
	let uploadFile;

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
			documents: {
				create: jasmine.createSpy( 'backend.documents.create' ),
				uploadComplete: jasmine.createSpy( 'backend.documents.uploadComplete' ),
				getScanStatus: jasmine.createSpy( 'backend.documents.getScanStatus' ),
			},
			barriers: {
				getInteractions: jasmine.createSpy( 'backend.barriers.getInteractions' ),
				getStatusHistory: jasmine.createSpy( 'backend.barriers.getStatusHistory' ),
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
		processor = {
			process: jasmine.createSpy( 'FormProcessor.process' )
		};
		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );
		FormProcessor = jasmine.createSpy( 'FormProcessor' ).and.callFake( () => processor );
		barrierDetailViewModel = jasmine.createSpy( 'barrierDetailViewModel' );
		interactionsViewModel = jasmine.createSpy( 'interactionsViewModel' );
		uploadFile = jasmine.createSpy( 'uploadFile' );

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
			'../../../lib/FormProcessor': FormProcessor,
			'../../../lib/validators': validators,
			'../view-models/detail': barrierDetailViewModel,
			'../view-models/interactions': interactionsViewModel,
			'../../../lib/upload-file': uploadFile,
		} );
	} );

	function returnSuccessResponses(){

		const interactionsResponse = {
			response: { isSuccess: true  },
			body: { results: [
				{ id: 1, text: 'one', pinned: false, created_on: 'Tue Sep 11 2018 06:16:40 GMT+0100 (BST)' },
				{ id: 2, text: 'two', pinned: true, created_on: 'Fri Jun 01 2018 01:43:07 GMT+0100 (BST)' },
			] }
		};
		const statusHistoryResponse = {
			response: { isSuccess: true },
			body: getFakeData( '/backend/barriers/status_history' )
		};

		backend.barriers.getInteractions.and.callFake( () => Promise.resolve( interactionsResponse ) );
		backend.barriers.getStatusHistory.and.callFake( () => Promise.resolve( statusHistoryResponse ) );

		return { interactionsResponse, statusHistoryResponse };
	}

	function returnViewModels(){

		const barrierDetailViewModelResponse = { barrier: true };
		const interactionsViewModelResponse = { interactions: true };

		barrierDetailViewModel.and.callFake( () => Object.assign( {}, barrierDetailViewModelResponse ) );
		interactionsViewModel.and.callFake( () => Object.assign( {}, interactionsViewModelResponse ) );

		return { barrierDetailViewModelResponse, interactionsViewModelResponse };
	}

	describe( 'list', () => {
		describe( 'Without an error', () => {
			describe( 'With a success response', () => {
				it( 'Should get the interactions and render the page', async () => {

					const { interactionsResponse, statusHistoryResponse } = returnSuccessResponses();
					const { barrierDetailViewModelResponse, interactionsViewModelResponse } = returnViewModels();

					await controller.list( req, res, next );

					expect( next ).not.toHaveBeenCalled();
					expect( backend.barriers.getInteractions ).toHaveBeenCalledWith( req, barrierId );
					expect( backend.barriers.getStatusHistory ).toHaveBeenCalledWith( req, barrierId );
					expect( barrierDetailViewModel ).toHaveBeenCalledWith( req.barrier );
					expect( interactionsViewModel ).toHaveBeenCalledWith( {
						interactions: interactionsResponse.body,
						statusHistory: statusHistoryResponse.body
					}, undefined );

					expect( res.render ).toHaveBeenCalledWith( 'barriers/views/interactions', Object.assign( {},
						barrierDetailViewModelResponse,
						{ interactions: interactionsViewModelResponse }
					) );
				} );
			} );

			describe( 'Without a success response', () => {
				describe( 'When the interactions returns a 500', () => {
					it( 'Should call next with an error', async () => {

						const interactionsResponse = {
							response: { isSuccess: false, statusCode: 500 },
							body: {}
						};
						const statusHistoryResponse = {
							response: { isSuccess: true, statusCode: 200 },
							body: getFakeData( '/backend/barriers/status_history' )
						};

						backend.barriers.getInteractions.and.callFake( () => Promise.resolve( interactionsResponse ) );
						backend.barriers.getStatusHistory.and.callFake( () => Promise.resolve( statusHistoryResponse ) );

						await controller.list( req, res, next );

						expect( next ).toHaveBeenCalledWith( new Error( `Unable to get interactions and statusHistory, got ${ interactionsResponse.response.statusCode } from interactions and ${ statusHistoryResponse.response.statusCode } from statusHistory` ) );
						expect( backend.barriers.getInteractions ).toHaveBeenCalledWith( req, req.barrier.id );
						expect( res.render ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'When the status_history returns a 500', () => {
					it( 'Should call next with an error', async () => {

						const interactionsResponse = {
							response: { isSuccess: true, statusCode: 200 },
							body: getFakeData( '/backend/barriers/interactions' )
						};
						const statusHistoryResponse = {
							response: { isSuccess: false, statusCode: 500 },
							body: getFakeData( '/backend/barriers/status_history' )
						};

						backend.barriers.getInteractions.and.callFake( () => Promise.resolve( interactionsResponse ) );
						backend.barriers.getStatusHistory.and.callFake( () => Promise.resolve( statusHistoryResponse ) );

						await controller.list( req, res, next );

						expect( next ).toHaveBeenCalledWith( new Error( `Unable to get interactions and statusHistory, got ${ interactionsResponse.response.statusCode } from interactions and ${ statusHistoryResponse.response.statusCode } from statusHistory` ) );
						expect( backend.barriers.getInteractions ).toHaveBeenCalledWith( req, req.barrier.id );
						expect( res.render ).not.toHaveBeenCalled();
					} );
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

		const template = 'barriers/views/interactions';
		let barrier;

		beforeEach( () => {

			barrier = jasmine.helpers.getFakeData( '/backend/barriers/barrier' );

			req.barrier = barrier;
		} );

		describe( 'add', () => {
			it( 'Should configure the Form correctly', async () => {

				await controller.notes.add( req, res, next );

				const args = Form.calls.argsFor( 0 );
				const config = args[ 1 ];

				expect( Form ).toHaveBeenCalled();
				expect( args[ 0 ] ).toEqual( req );

				expect( config.note ).toBeDefined();
				expect( config.note.required ).toBeDefined();

				expect( config.pinned ).toBeDefined();
			} );

			describe( 'configuring the FormProcessor', () => {
				describe( 'With no document', () => {
					it( 'Should configure the FormProcessor correctly', async () => {

						const { interactionsResponse, statusHistoryResponse } = returnSuccessResponses();
						const { barrierDetailViewModelResponse, interactionsViewModelResponse } = returnViewModels();

						await controller.notes.add( req, res, next );

						const config = FormProcessor.calls.argsFor( 0 )[ 0 ];
						const templateValues = { abc: '123' };
						const formValues = { note: 'a note', pinned: false, a: 'test' };
						const interactionsUrlResponse = '/barrier/interactions';

						expect( config.form ).toEqual( form );
						expect( typeof config.render ).toEqual( 'function' );
						expect( typeof config.saveFormData ).toEqual( 'function' );
						expect( typeof config.saved ).toEqual( 'function' );

						await config.render( templateValues );

						expect( res.render ).toHaveBeenCalledWith( template, Object.assign( {},
							barrierDetailViewModelResponse,
							{ interactions: interactionsViewModelResponse },
							{ noteForm: true },
							templateValues
						) );

						expect( barrierDetailViewModel ).toHaveBeenCalledWith( req.barrier );
						expect( interactionsViewModel ).toHaveBeenCalledWith( {
							interactions: interactionsResponse.body,
							statusHistory: statusHistoryResponse.body
						}, undefined );

						config.saveFormData( formValues );

						expect( backend.barriers.notes.save ).toHaveBeenCalledWith( req, req.barrier.id, {
							note: formValues.note,
							pinned: formValues.pinned,
						} );

						urls.barriers.interactions.and.callFake( () => interactionsUrlResponse );

						config.saved();

						expect( res.redirect ).toHaveBeenCalledWith( interactionsUrlResponse );
						expect( urls.barriers.interactions ).toHaveBeenCalledWith( barrier.id );
						expect( next ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'With a documentId', () => {
					it( 'Should configure the saveFormData correctly', async () => {

						await controller.notes.add( req, res, next );

						const config = FormProcessor.calls.argsFor( 0 )[ 0 ];
						const formValues = {
							note: faker.lorem.words(),
							pinned: true,
							documentId: uuid(),
						};

						config.saveFormData( formValues );

						expect( backend.barriers.notes.save ).toHaveBeenCalledWith( req, req.barrier.id, {
							note: formValues.note,
							pinned: formValues.pinned,
							documentId: formValues.documentId
						} );

						expect( next ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'With a document', () => {
					describe( 'When uploadDocument and getScanStatus return success', () => {
						it( 'Should configure the saveFormData correctly', async () => {

							await controller.notes.add( req, res, next );

							const config = FormProcessor.calls.argsFor( 0 )[ 0 ];
							const documentId = uuid();
							const signed_upload_url = 'a/b/c';
							const formValues = {
								note: faker.lorem.words(),
								pinned: true,
								document: { name: 'a document', size: 12 },
							};

							backend.documents.create.and.callFake( () => Promise.resolve( { response: {
								isSuccess: true
							}, body: {
								id: documentId,
								signed_upload_url,
							} }));

							uploadFile.and.callFake( () => Promise.resolve( {
								response: { statusCode: 200 },
							} ) );

							backend.documents.uploadComplete.and.callFake( () => Promise.resolve( {
								response: { isSuccess: true },
							} ) );

							backend.documents.getScanStatus.and.callFake( () => Promise.resolve( {
								status: 'virus_scanned',
								passed: true,
							} ) );

							await config.saveFormData( formValues );

							expect( backend.documents.create ).toHaveBeenCalledWith( req, formValues.document.name );
							expect( uploadFile ).toHaveBeenCalledWith( signed_upload_url, formValues.document );
							expect( backend.documents.uploadComplete ).toHaveBeenCalledWith( req, documentId );
							expect( backend.documents.getScanStatus ).toHaveBeenCalledWith( req, documentId );
							expect( backend.barriers.notes.save ).toHaveBeenCalledWith( req, req.barrier.id, {
								note: formValues.note,
								pinned: formValues.pinned,
								documentId
							} );
							expect( next ).not.toHaveBeenCalled();
						} );
					} );
				} );
			} );

			describe( 'When the processor does not throw an error', () => {
				it( 'Should not call next', async () => {

					await controller.notes.add( req, res, next );

					expect( next ).not.toHaveBeenCalled();
				} );
			} );

			describe( 'When the processor throws an errror', () => {
				it( 'Should call next with the error', async () => {

					const err = new Error( 'a random error' );

					processor.process.and.callFake( () => { throw err; } );

					await controller.notes.add( req, res, next );

					expect( next ).toHaveBeenCalledWith( err );
				} );
			} );
		} );

		describe( 'edit', () => {
			describe( 'When the noteId is invalid', () => {
				it( 'Should call next with an error', async () => {

					req.params.noteId = 'abc';
					validators.isNumeric.and.callFake( () => false );

					await controller.notes.edit( req, res, next );

					expect( next ).toHaveBeenCalledWith( new Error( 'Invalid noteId' ) );
					expect( res.render ).not.toHaveBeenCalled();
				} );
			} );

			describe( 'when the noteId is valid', () => {

				let editId;

				beforeEach( () => {

					editId = 34;
					req.params.noteId = editId;
					validators.isNumeric.and.callFake( () => true );
				} );

				it( 'Should configure the Form correctly', async () => {

					await controller.notes.edit( req, res, next );

					const args = Form.calls.argsFor( 0 );
					const config = args[ 1 ];

					expect( Form ).toHaveBeenCalled();
					expect( args[ 0 ] ).toEqual( req );

					expect( config.note ).toBeDefined();
					expect( config.note.required ).toBeDefined();
				} );

				it( 'Should configure the FormProcessor correctly', async () => {

					const { interactionsResponse, statusHistoryResponse } = returnSuccessResponses();
					const { barrierDetailViewModelResponse, interactionsViewModelResponse } = returnViewModels();

					await controller.notes.edit( req, res );

					const config = FormProcessor.calls.argsFor( 0 )[ 0 ];
					const templateValues = { abc: '123' };
					const formValues = { def: 456 };
					const interactionsUrlResponse = '/barrier/interactions';

					expect( config.form ).toEqual( form );
					expect( typeof config.render ).toEqual( 'function' );
					expect( typeof config.saveFormData ).toEqual( 'function' );
					expect( typeof config.saved ).toEqual( 'function' );

					await config.render( templateValues );

					expect( res.render ).toHaveBeenCalledWith( template, Object.assign( {},
						barrierDetailViewModelResponse,
						{ interactions: interactionsViewModelResponse },
						templateValues
					) );

					expect( barrierDetailViewModel ).toHaveBeenCalledWith( req.barrier );
					expect( interactionsViewModel ).toHaveBeenCalledWith( {
						interactions: interactionsResponse.body,
						statusHistory: statusHistoryResponse.body
					}, editId );

					config.saveFormData( formValues );

					expect( backend.barriers.notes.update ).toHaveBeenCalledWith( req, editId, formValues );

					urls.barriers.interactions.and.callFake( () => interactionsUrlResponse );

					config.saved();

					expect( res.redirect ).toHaveBeenCalledWith( interactionsUrlResponse );
					expect( urls.barriers.interactions ).toHaveBeenCalledWith( barrier.id );
				} );

				describe( 'When the processor does not throw an error', () => {
					it( 'Should not call next', async () => {

						await controller.notes.edit( req, res, next );

						expect( next ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'When the processor throws an errror', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'a random error' );

						processor.process.and.callFake( () => { throw err; } );

						await controller.notes.edit( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
					} );
				} );
			} );
		} );
	} );
} );
