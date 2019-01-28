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
			params: {},
			query: {addCompany: true},
			flash: jasmine.createSpy( 'req.flash' )
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
				getHistory: jasmine.createSpy( 'backend.barriers.getHistory' ),
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
		const historyResponse = {
			response: { isSuccess: true },
			body: getFakeData( '/backend/barriers/history' )
		};

		backend.barriers.getInteractions.and.callFake( () => Promise.resolve( interactionsResponse ) );
		backend.barriers.getHistory.and.callFake( () => Promise.resolve( historyResponse ) );

		return { interactionsResponse, historyResponse };
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

					const { interactionsResponse, historyResponse } = returnSuccessResponses();
					const { barrierDetailViewModelResponse, interactionsViewModelResponse } = returnViewModels();

					await controller.list( req, res, next );

					expect( next ).not.toHaveBeenCalled();
					expect( backend.barriers.getInteractions ).toHaveBeenCalledWith( req, barrierId );
					expect( backend.barriers.getHistory ).toHaveBeenCalledWith( req, barrierId );
					expect( barrierDetailViewModel ).toHaveBeenCalledWith( req.barrier, req.query.addCompany );
					expect( interactionsViewModel ).toHaveBeenCalledWith( {
						interactions: interactionsResponse.body,
						history: historyResponse.body
					}, undefined );

					expect( res.render ).toHaveBeenCalledWith( 'barriers/views/detail', Object.assign( {},
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
						const historyResponse = {
							response: { isSuccess: true, statusCode: 200 },
							body: getFakeData( '/backend/barriers/history' )
						};

						backend.barriers.getInteractions.and.callFake( () => Promise.resolve( interactionsResponse ) );
						backend.barriers.getHistory.and.callFake( () => Promise.resolve( historyResponse ) );

						await controller.list( req, res, next );

						expect( next ).toHaveBeenCalledWith( new Error( `Unable to get interactions and history, got ${ interactionsResponse.response.statusCode } from interactions and ${ historyResponse.response.statusCode } from history` ) );
						expect( backend.barriers.getInteractions ).toHaveBeenCalledWith( req, req.barrier.id );
						expect( res.render ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'When the history returns a 500', () => {
					it( 'Should call next with an error', async () => {

						const interactionsResponse = {
							response: { isSuccess: true, statusCode: 200 },
							body: getFakeData( '/backend/barriers/interactions' )
						};
						const historyResponse = {
							response: { isSuccess: false, statusCode: 500 },
							body: getFakeData( '/backend/barriers/history' )
						};

						backend.barriers.getInteractions.and.callFake( () => Promise.resolve( interactionsResponse ) );
						backend.barriers.getHistory.and.callFake( () => Promise.resolve( historyResponse ) );

						await controller.list( req, res, next );

						expect( next ).toHaveBeenCalledWith( new Error( `Unable to get interactions and history, got ${ interactionsResponse.response.statusCode } from interactions and ${ historyResponse.response.statusCode } from history` ) );
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

		const template = 'barriers/views/detail';
		let barrier;

		beforeEach( () => {

			barrier = jasmine.helpers.getFakeData( '/backend/barriers/barrier' );

			req.barrier = barrier;
			req.query = { addCompany: true};
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

						const { interactionsResponse, historyResponse } = returnSuccessResponses();
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
							{ noteForm: true, noteErrorText: 'Add text for the note.' },
							templateValues
						) );

						expect( barrierDetailViewModel ).toHaveBeenCalledWith( req.barrier );
						expect( interactionsViewModel ).toHaveBeenCalledWith( {
							interactions: interactionsResponse.body,
							history: historyResponse.body
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

					let config;
					let formValues;

					beforeEach( async () => {

						await controller.notes.add( req, res, next );

						config = FormProcessor.calls.argsFor( 0 )[ 0 ];
						formValues = {
							note: faker.lorem.words(),
							pinned: true,
							documentId: uuid(),
						};
					} );

					afterEach( () => {

						expect( backend.barriers.notes.save ).toHaveBeenCalledWith( req, req.barrier.id, {
							note: formValues.note,
							pinned: formValues.pinned,
							documentId: formValues.documentId
						} );

						expect( next ).not.toHaveBeenCalled();
					} );

					describe( 'When there are documents in the session', () => {
						it( 'Should remove the documents for this barrier id', () => {

							const doc1 = { barrierId: uuid(), documentId: uuid() };
							const doc2 = { barrierId: uuid(), documentId: uuid() };

							req.session.barrierDocuments = [
								doc1,
								{ barrierId: barrier.id, documentId: formValues.documentId },
								doc2,
							];

							config.saveFormData( formValues );
							config.saved();

							expect( req.session.barrierDocuments ).toEqual( [
								doc1, doc2
							] );
						} );
					} );

					describe( 'When there are not any documents in the session', () => {
						it( 'Should configure the saveFormData correctly', async () => {

							config.saveFormData( formValues );
						} );
					} );
				} );

				describe( 'With a document', () => {

					let config;
					let formValues;
					let signed_upload_url;
					let documentId;

					beforeEach( async () => {

						await controller.notes.add( req, res, next );

						config = FormProcessor.calls.argsFor( 0 )[ 0 ];
						documentId = uuid();
						signed_upload_url = 'a/b/c';
						formValues = {
							note: faker.lorem.words(),
							pinned: true,
							document: { name: 'a document', size: 12 },
						};
					} );

					describe( 'When uploadDocument rejects', () => {
						it( 'Should call next with an error', async () => {

							const err = new Error( 'My test' );

							backend.documents.create.and.callFake( () => Promise.reject( err ) );

							await config.saveFormData( formValues );

							expect( next ).toHaveBeenCalledWith( err );
						} );
					} );

					describe( 'When uploadDocument returns success', () => {

						beforeEach( () => {

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
						} );

						afterEach( () => {

							expect( backend.documents.create ).toHaveBeenCalledWith( req, formValues.document.name, formValues.document.size );
							expect( uploadFile ).toHaveBeenCalledWith( signed_upload_url, formValues.document );
							expect( backend.documents.uploadComplete ).toHaveBeenCalledWith( req, documentId );
							expect( backend.documents.getScanStatus ).toHaveBeenCalledWith( req, documentId );
						} );

						describe( 'When getScanStatus return success', () => {
							it( 'Should configure the saveFormData correctly', async () => {

								backend.documents.getScanStatus.and.callFake( () => Promise.resolve( {
									status: 'virus_scanned',
									passed: true,
								} ) );

								await config.saveFormData( formValues );

								expect( backend.barriers.notes.save ).toHaveBeenCalledWith( req, req.barrier.id, {
									note: formValues.note,
									pinned: formValues.pinned,
									documentId
								} );
								expect( next ).not.toHaveBeenCalled();
							} );
						} );

						describe( 'When getScanStatus returns pass false', () => {
							it( 'Should throw an error', async () => {

								backend.documents.getScanStatus.and.callFake( () => Promise.resolve( {
									status: 'virus_scanned',
									passed: false,
								} ) );

								await config.saveFormData( formValues );

								expect( next ).toHaveBeenCalledWith( new Error( 'This file may be infected with a virus and will not be accepted.' ) );
							} );
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
					req.params.id = editId;
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

					const { interactionsResponse, historyResponse } = returnSuccessResponses();
					const { barrierDetailViewModelResponse, interactionsViewModelResponse } = returnViewModels();
					req.query.addCompany = true;

					await controller.notes.edit( req, res );

					const config = FormProcessor.calls.argsFor( 0 )[ 0 ];
					const templateValues = { abc: '123', addCompany: true};
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

					expect( barrierDetailViewModel ).toHaveBeenCalledWith( req.barrier, req.query);
					expect( interactionsViewModel ).toHaveBeenCalledWith( {
						interactions: interactionsResponse.body,
						history: historyResponse.body
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
