const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const faker = require( 'faker' );

const modulePath = './interactions';
const { getFakeData, mocks } = jasmine.helpers;

describe( 'Barrier interactions controller', () => {

	let controller;
	let req;
	let res;
	let next;
	let backend;
	let urls;
	let config;
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
	let uploadDocument;
	let reporter;

	beforeEach( () => {

		( { req, res, next } = mocks.middleware() );
		barrierId = uuid();
		config = { addCompany: false };
		req.barrier = { id: barrierId };

		backend = {
			documents: {
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
		Form.FILE = 'file-type';
		FormProcessor = jasmine.createSpy( 'FormProcessor' ).and.callFake( () => processor );
		barrierDetailViewModel = jasmine.createSpy( 'barrierDetailViewModel' );
		interactionsViewModel = jasmine.createSpy( 'interactionsViewModel' );
		uploadDocument = jasmine.createSpy( 'uploadDocument' );

		validators = {
			isNumeric: jasmine.createSpy( 'validators.isNumeric' ),
			isDateValue: jasmine.createSpy( 'validators.isDateValue' ),
			isDateValid: ( name ) => jasmine.createSpy( 'validators.isDateValid: ' + name ),
			isDateInPast: jasmine.createSpy( 'validators.isDateInPast' ),
			isMetadata: jasmine.createSpy( 'validators.isMetadata' ),
			isSector: jasmine.createSpy( 'validators.isSector' ),
			isDateNumeric: jasmine.createSpy( 'validators.isDateNumeric' ),
			isValidFile: jasmine.createSpy( 'validators.isValidFile' ),
		};

		reporter = mocks.reporter();

		controller = proxyquire( modulePath, {
			'../../../config': config,
			'../../../lib/backend-service': backend,
			'../../../lib/urls': urls,
			'../../../lib/Form': Form,
			'../../../lib/FormProcessor': FormProcessor,
			'../../../lib/validators': validators,
			'../view-models/detail': barrierDetailViewModel,
			'../view-models/interactions': interactionsViewModel,
			'../../../lib/upload-document': uploadDocument,
			'../../../lib/reporter': reporter,
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

	async function check( addCompany ){

		const { interactionsResponse, historyResponse } = returnSuccessResponses();
		const { barrierDetailViewModelResponse, interactionsViewModelResponse } = returnViewModels();

		await controller.list( req, res, next );

		expect( next ).not.toHaveBeenCalled();
		expect( backend.barriers.getInteractions ).toHaveBeenCalledWith( req, barrierId );
		expect( backend.barriers.getHistory ).toHaveBeenCalledWith( req, barrierId );
		expect( barrierDetailViewModel ).toHaveBeenCalledWith( req.barrier, addCompany );
		expect( interactionsViewModel ).toHaveBeenCalledWith( {
			interactions: interactionsResponse.body,
			history: historyResponse.body
		}, undefined );

		expect( res.render ).toHaveBeenCalledWith( 'barriers/views/detail', Object.assign( {},
			barrierDetailViewModelResponse,
			{ interactions: interactionsViewModelResponse }
		) );
	}

	describe( 'list', () => {
		describe( 'Without an error', () => {
			describe( 'With a success response', () => {
				describe( 'With config.addCompany set to true', () => {

					beforeEach( () => {

						config.addCompany = true;
					} );

					describe( 'With no query', () => {
						it( 'Should render the barrier detail page with addCompany true', async () => {

							await check( true );
						} );
					} );

					describe( 'With query set to true', () => {
						it( 'Should render the barrier detail page with addCompany true', async () => {

							req.query.addCompany = true;

							await check( true );
						} );
					} );
				} );
				describe( 'With config.addCompany set to false', () => {

					beforeEach( () => {

						config.addCompany = false;
					} );

					describe( 'With no query', () => {
						it( 'Should render the barrier detail page with addCompany false', async () => {

							await check( false );
						} );
					} );

					describe( 'With query set to true', () => {
						it( 'Should render the barrier detail page with addCompany true', async () => {

							req.query.addCompany = true;

							await check( true );
						} );
					} );
				} );
			} );

			describe( 'With no flash message', () => {
				it( 'Should not add a toast message to the locals', async () => {

					await controller.list( req, res, next );
					expect( res.locals.toast ).not.toBeDefined();
				} );
			} );

			describe( 'With a flash message of barrier-created', () => {
				it( 'Should add a toast message to the locals', async () => {

					req.flash.and.callFake( () => [ uuid() ] ) ;
					await controller.list( req, res, next );
					expect( res.locals.toast ).toEqual( {
						heading: 'Barrier added to the service',
						message: 'Continue to add more detail to your barrier'
					});
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

			barrier = getFakeData( '/backend/barriers/barrier' );

			req.barrier = barrier;
		} );

		describe( 'add', () => {
			describe( 'Configuring the Form', () => {

				let args;
				let config;

				beforeEach( async () => {

					await controller.notes.add( req, res, next );

					args = Form.calls.argsFor( 0 );
					config = args[ 1 ];
				} );

				it( 'Should have the correct config', async () => {

					expect( Form ).toHaveBeenCalled();
					expect( args[ 0 ] ).toEqual( req );

					expect( config.note ).toBeDefined();
					expect( config.note.required ).toBeDefined();

					expect( config.pinned ).not.toBeDefined();

					expect( config.document ).toBeDefined();
					expect( config.document.type ).toEqual( Form.FILE );
					expect( config.document.validators.length ).toEqual( 1 );
				} );

				describe( 'document validator', () => {

					let validator;
					let file;

					beforeEach( () => {

						validator = config.document.validators[ 0 ].fn;
						file = { name: 'test.txt', size: 10, type: 'text/plain' };
					} );

					describe( 'When the file is valid', () => {
						it( 'Should return true', () => {

							validators.isValidFile.and.callFake( () => true );

							expect( validator( file ) ).toEqual( true );
							expect( validators.isValidFile ).toHaveBeenCalledWith( file );
							expect( reporter.message ).not.toHaveBeenCalled();
						} );
					} );

					describe( 'When the file is invalid', () => {
						it( 'Should return false and report the file', () => {

							validators.isValidFile.and.callFake( () => false );

							expect( validator( file ) ).toEqual( false );
							expect( validators.isValidFile ).toHaveBeenCalledWith( file );
							expect( reporter.message ).toHaveBeenCalledWith( 'info', 'Invalid document type: ' + file.type, { size: file.size, name: file.name } );
						} );
					} );
				} );
			} );

			describe( 'configuring the FormProcessor', () => {
				describe( 'With no document POSTed', () => {

					async function checkProcessor( { renderDocs, saveDocs, sessionDocs } ){
						const { interactionsResponse, historyResponse } = returnSuccessResponses();
							const { barrierDetailViewModelResponse, interactionsViewModelResponse } = returnViewModels();

							await controller.notes.add( req, res, next );

							const config = FormProcessor.calls.argsFor( 0 )[ 0 ];
							const templateValues = { abc: '123' };
							const formValues = { note: 'a note', a: 'test' };
							const detailUrlResponse = '/barrier';

							expect( config.form ).toEqual( form );
							expect( typeof config.render ).toEqual( 'function' );
							expect( typeof config.saveFormData ).toEqual( 'function' );
							expect( typeof config.saved ).toEqual( 'function' );

							await config.render( templateValues );

							expect( res.render ).toHaveBeenCalledWith( template, Object.assign( {},
								barrierDetailViewModelResponse,
								templateValues,
								{
									interactions: interactionsViewModelResponse,
									showNoteForm: true,
									noteErrorText: 'Add text for the note.',
									pageTitleSuffix: ' - Add a note',
									documents: renderDocs,
								},
							) );

							expect( barrierDetailViewModel ).toHaveBeenCalledWith( req.barrier, false );
							expect( interactionsViewModel ).toHaveBeenCalledWith( {
								interactions: interactionsResponse.body,
								history: historyResponse.body
							}, undefined );

							config.saveFormData( formValues );

							expect( backend.barriers.notes.save ).toHaveBeenCalledWith( req, req.barrier.id, {
								note: formValues.note,
								documentIds: saveDocs
							} );

							urls.barriers.detail.and.callFake( () => detailUrlResponse );

							config.saved();

							expect( res.redirect ).toHaveBeenCalledWith( detailUrlResponse );
							expect( urls.barriers.detail ).toHaveBeenCalledWith( barrier.id );
							expect( next ).not.toHaveBeenCalled();
							expect( req.session.barrierDocuments ).toEqual( sessionDocs );
					}
					describe( 'With no documents in the session', () => {
						it( 'Should configure the FormProcessor correctly', async () => {

							await checkProcessor({
								renderDocs: [],
								saveDocs: [],
							});
						} );
					} );

					describe( 'With documents in the session', () => {

						let nonMatchingDoc1;
						let nonMatchingDoc2;

						beforeEach( () => {

							nonMatchingDoc1 = { barrierId: uuid(), document: { name: '1.jpg', size: 10 } };
							nonMatchingDoc2 = { barrierId: uuid(), document: { name: '2.jpg', size: 20 } };
						} );

						describe( 'With a matching doc', () => {
							it( 'Should configure the FormProcessor correctly', async () => {

								const matchingDoc = { barrierId: barrier.id, document: { name: 'match.jpg', size: 30 } };
								req.session.barrierDocuments = [ nonMatchingDoc1, nonMatchingDoc2, matchingDoc ];

								await checkProcessor({
									renderDocs: [ matchingDoc.document ],
									saveDocs: [ matchingDoc.document.id ],
									sessionDocs: [ nonMatchingDoc1, nonMatchingDoc2 ],
								});
							} );
						} );

						describe( 'Without a matching doc', () => {
							it( 'Should configure the FormProcessor correctly', async () => {

								req.session.barrierDocuments = [ nonMatchingDoc1, nonMatchingDoc2 ];

								await checkProcessor({
									renderDocs: [],
									saveDocs: [],
									sessionDocs: [ nonMatchingDoc1, nonMatchingDoc2 ],
								});
							} );
						} );
					} );
				} );

				describe( 'With a document', () => {

					let config;
					let formValues;
					let documentId;

					beforeEach( async () => {

						await controller.notes.add( req, res, next );

						config = FormProcessor.calls.argsFor( 0 )[ 0 ];
						documentId = uuid();
						formValues = {
							note: faker.lorem.words(),
							document: { name: 'a document', size: 12 },
						};
					} );

					describe( 'When uploadDocument rejects', () => {
						it( 'Should call next with an error', async () => {

							const err = new Error( 'My test' );

							uploadDocument.and.callFake( () => Promise.reject( err ) );

							await config.saveFormData( formValues );

							expect( next ).toHaveBeenCalledWith( err );
						} );
					} );

					describe( 'When uploadDocument resolves', () => {

						beforeEach( () => {

							uploadDocument.and.callFake( () => Promise.resolve( documentId ) );
						} );

						afterEach( () => {

							expect( uploadDocument ).toHaveBeenCalledWith( req, formValues.document );
							expect( backend.documents.getScanStatus ).toHaveBeenCalledWith( req, documentId );
						} );

						describe( 'When getScanStatus return success', () => {
							it( 'Should configure saveFormData correctly', async () => {

								backend.documents.getScanStatus.and.callFake( () => Promise.resolve( {
									status: 'virus_scanned',
									passed: true,
								} ) );

								await config.saveFormData( formValues );

								expect( backend.barriers.notes.save ).toHaveBeenCalledWith( req, req.barrier.id, {
									note: formValues.note,
									documentIds: [ documentId ]
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
					const detailUrlResponse = '/barrier/';

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

					expect( barrierDetailViewModel ).toHaveBeenCalledWith( req.barrier, req.query.addCompany);
					expect( interactionsViewModel ).toHaveBeenCalledWith( {
						interactions: interactionsResponse.body,
						history: historyResponse.body
					}, editId );

					config.saveFormData( formValues );

					expect( backend.barriers.notes.update ).toHaveBeenCalledWith( req, editId, formValues );

					urls.barriers.detail.and.callFake( () => detailUrlResponse );

					config.saved();

					expect( res.redirect ).toHaveBeenCalledWith( detailUrlResponse );
					expect( urls.barriers.detail ).toHaveBeenCalledWith( barrier.id );
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
