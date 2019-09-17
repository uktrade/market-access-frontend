const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const faker = require( 'faker' );
const HttpResponseError = require( '../../../lib/HttpResponseError' );

const modulePath = './interactions';
const { getFakeData, mocks } = jasmine.helpers;

describe( 'Barrier interactions controller', () => {

	let controller;
	let req;
	let res;
	let next;
	let csrfToken;
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
	let documentControllers;

	beforeEach( () => {

		( { req, res, next, csrfToken } = mocks.middleware() );
		barrierId = uuid();
		config = {
			addCompany: false,
			files: {
				maxSize: ( 5 * 1024 * 1024 ),
				types: [ 'image/jpeg', 'text/csv' ]
			}
		};
		req.barrier = { id: barrierId };

		backend = {
			documents: {
				getScanStatus: jasmine.createSpy( 'backend.documents.getScanStatus' ),
				delete: jasmine.createSpy( 'backend.documents.delete' ),
			},
			barriers: {
				getInteractions: jasmine.createSpy( 'backend.barriers.getInteractions' ),
				getHistory: jasmine.createSpy( 'backend.barriers.getHistory' ),
				notes: {
					save: jasmine.createSpy( 'backend.barriers.notes.save' ),
					update: jasmine.createSpy( 'backend.barriers.notes.update' ),
					delete: jasmine.createSpy( 'backend.barriers.notes.delete' ),
				},
				assessment: {
					getHistory: jasmine.createSpy( 'backend.barriers.assessment.getHistory' ),
				},
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
				},
				notes: {
					edit: jasmine.createSpy( 'urls.barriers.notes.edit' ),
				}
			}
		};

		getValuesResponse = { a: 1, b: 2 };
		getTemplateValuesResponse = { c: 3, d: 4 };
		form = {
			validate: jasmine.createSpy( 'form.validate' ),
			getValues: jasmine.createSpy( 'form.getValues' ).and.callFake( () => getValuesResponse ),
			getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.callFake( () => getTemplateValuesResponse ),
			addErrors: jasmine.createSpy( 'form.addErrros' ),
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
			isUuid: jasmine.createSpy( 'validators.isUuid' ),
		};

		reporter = mocks.reporter();
		documentControllers = mocks.documentControllers();

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
			'../../../lib/document-controllers': documentControllers,
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
		const assessmentHistoryResponse = {
			response: { isSuccess: true },
			body: getFakeData( '/backend/barriers/assessment_history' ),
		};

		backend.barriers.getInteractions.and.returnValue( Promise.resolve( interactionsResponse ) );
		backend.barriers.getHistory.and.returnValue( Promise.resolve( historyResponse ) );
		backend.barriers.assessment.getHistory.and.returnValue( Promise.resolve( assessmentHistoryResponse ) );

		return { interactionsResponse, historyResponse, assessmentHistoryResponse };
	}

	function returnViewModels(){

		const barrierDetailViewModelResponse = { barrier: true };
		const interactionsViewModelResponse = { interactions: true };

		barrierDetailViewModel.and.callFake( () => Object.assign( {}, barrierDetailViewModelResponse ) );
		interactionsViewModel.and.callFake( () => Object.assign( {}, interactionsViewModelResponse ) );

		return { barrierDetailViewModelResponse, interactionsViewModelResponse };
	}

	async function check( controller, addCompany, data = {} ){

		const { interactionsResponse, historyResponse, assessmentHistoryResponse } = returnSuccessResponses();
		const { barrierDetailViewModelResponse, interactionsViewModelResponse } = returnViewModels();

		req.barrier.has_assessment = true;

		await controller( req, res, next );

		expect( next ).not.toHaveBeenCalled();
		expect( backend.barriers.getInteractions ).toHaveBeenCalledWith( req, barrierId );
		expect( backend.barriers.getHistory ).toHaveBeenCalledWith( req, barrierId );
		expect( barrierDetailViewModel ).toHaveBeenCalledWith( req.barrier, addCompany );
		expect( interactionsViewModel ).toHaveBeenCalledWith( {
			interactions: interactionsResponse.body,
			history: historyResponse.body,
			assessmentHistory: assessmentHistoryResponse,
		}, undefined );

		expect( res.render ).toHaveBeenCalledWith( 'barriers/views/detail',  {
			...barrierDetailViewModelResponse,
			interactions: interactionsViewModelResponse,
			...data
		} );
	}

	describe( 'list', () => {

		async function checkList( addCompany ){

			await check( controller.list, addCompany );
		}

		describe( 'Without an error', () => {
			describe( 'With a success response', () => {
				describe( 'With config.addCompany set to true', () => {

					beforeEach( () => {

						config.addCompany = true;
					} );

					describe( 'With no query', () => {
						it( 'Should render the barrier detail page with addCompany true', async () => {

							await checkList( true );
						} );
					} );

					describe( 'With query set to true', () => {
						it( 'Should render the barrier detail page with addCompany true', async () => {

							req.query.addCompany = true;

							await checkList( true );
						} );
					} );
				} );
				describe( 'With config.addCompany set to false', () => {

					beforeEach( () => {

						config.addCompany = false;
					} );

					describe( 'With no query', () => {
						it( 'Should render the barrier detail page with addCompany false', async () => {

							await checkList( false );
						} );
					} );

					describe( 'With query set to true', () => {
						it( 'Should render the barrier detail page with addCompany true', async () => {

							req.query.addCompany = true;

							await checkList( true );
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

		function checkFormConfig(){

			let args;
			let config;

			beforeEach( () => {

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
						expect( documentControllers.reportInvalidFile ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'When the file is invalid', () => {
					it( 'Should return false and report the file', () => {

						validators.isValidFile.and.callFake( () => false );

						expect( validator( file ) ).toEqual( false );
						expect( validators.isValidFile ).toHaveBeenCalledWith( file );
						expect( documentControllers.reportInvalidFile ).toHaveBeenCalledWith( file );
					} );
				} );
			} );
		}

		describe( 'add', () => {
			describe( 'Configuring the Form', () => {

				beforeEach( async () => {

					await controller.notes.add( req, res, next );
				} );

				checkFormConfig();
			} );

			describe( 'When there is a formError', () => {
				it( 'Should add the error to the form', async () => {

					req.formError = new Error( 'Something about maxFileSize exceeded' );

					await controller.notes.add( req, res, next );

					expect( form.addErrors ).toHaveBeenCalled();

					const args = form.addErrors.calls.argsFor( 0 );

					expect( args[ 0 ].document ).toBeDefined();
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
							history: historyResponse.body,
							assessmentHistory: undefined,
						}, undefined );

						config.saveFormData( formValues );

						expect( backend.barriers.notes.save ).toHaveBeenCalledWith( req, req.barrier.id, {
							note: formValues.note,
							documentIds: saveDocs
						} );

						urls.barriers.detail.and.callFake( () => detailUrlResponse );

						config.saved();

						expect( res.redirect ).toHaveBeenCalledWith( detailUrlResponse );
						expect( urls.barriers.detail ).toHaveBeenCalledWith( barrierId );
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

								const matchingDoc = { barrierId, document: { name: 'match.jpg', size: 30 } };
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

								expect( next ).toHaveBeenCalledWith( new Error( documentControllers.FILE_INFECTED_MESSAGE ) );
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

			let editId;

			beforeEach( () => {

				editId = 6;
				req.params.id = editId;
				req.note = getFakeData( '/backend/barriers/interactions' ).results[ 0 ];
			} );

			describe( 'Configuring the Form', () => {

				beforeEach( async () => {

					await controller.notes.edit( req, res, next );
				} );

				checkFormConfig();
			} );

			describe( 'configuring the FormProcessor', () => {

				async function checkProcessor( { renderDocs, saveDocs, sessionDocs } ){

					const { interactionsResponse, historyResponse } = returnSuccessResponses();
					const { barrierDetailViewModelResponse, interactionsViewModelResponse } = returnViewModels();

					req.query.addCompany = true;

					await controller.notes.edit( req, res );

					const config = FormProcessor.calls.argsFor( 0 )[ 0 ];
					const templateValues = { abc: '123', addCompany: true};
					const formValues = { def: 456 };
					const detailUrlResponse = '/barrier/';

					expect( req.session.noteDocuments[ editId ] ).toEqual( sessionDocs );

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
							noteErrorText: 'Add text for the note.',
							pageTitleSuffix: ' - Edit a note',
							documents: renderDocs,
						},
					) );

					expect( barrierDetailViewModel ).toHaveBeenCalledWith( req.barrier, req.query.addCompany);
					expect( interactionsViewModel ).toHaveBeenCalledWith( {
						interactions: interactionsResponse.body,
						history: historyResponse.body,
						assessmentHistory: undefined,
					}, editId );

					config.saveFormData( formValues );

					expect( backend.barriers.notes.update ).toHaveBeenCalledWith( req, editId, {
						note: formValues.note,
						documentIds: saveDocs,
					} );

					urls.barriers.detail.and.callFake( () => detailUrlResponse );

					config.saved();

					expect( res.redirect ).toHaveBeenCalledWith( detailUrlResponse );
					expect( urls.barriers.detail ).toHaveBeenCalledWith( barrierId );
				}

				describe( 'With no documents in the session', () => {
					describe( 'When the note does not have any documents', () => {
						it( 'Should configure it correctly', async () => {

							await checkProcessor( {
								renderDocs: [],
								saveDocs: [],
								sessionDocs: []
							} );
						} );
					} );

					describe( 'When the note has documents', () => {
						it( 'Should add the documents to the session', async () => {

							const doc1 = { id: uuid(), name: 'test-1.txt', size: 100 };
							const doc2 = { id: uuid(), name: 'test-2.txt', size: 200 };

							req.note.documents = [ doc1, doc2 ];

							await checkProcessor( {
								renderDocs: [ { ...doc1, size: '100 Bytes' }, { ...doc2, size: '200 Bytes' } ],
								saveDocs: [ doc1.id, doc2.id ],
								sessionDocs: [ { document: { ...doc1, size: '100 Bytes' } }, { document: { ...doc2, size: '200 Bytes' } } ],
							} );
						} );
					} );
				} );

				describe( 'With documents in the session', () => {

					let matchingDoc;
					let nonMatchingDoc1;

					beforeEach( () => {

						matchingDoc = { document: { id: uuid(), name: 'test1.jpg' } };
						nonMatchingDoc1 = { document: { id: uuid(), name: 'test3.txt' } };

						req.session.noteDocuments = {
							[ editId ]: [ matchingDoc ],
							123: [ nonMatchingDoc1 ]
						};
					} );

					describe( 'When the note has documents', () => {
						it( 'Should not add the documents to the session', async () => {

							req.note.documents = [ { id: uuid(), name: 'test2.txt', size: 100 } ];

							await checkProcessor( {
								renderDocs: [ matchingDoc.document ],
								saveDocs: [ matchingDoc.document.id ],
								sessionDocs: [ matchingDoc ],
							} );
						} );
					} );

					describe( 'When the note has documents that are alredy in the session', () => {
						it( 'Should not add them again', async () => {

							req.note.documents = [ matchingDoc.document ];

							await checkProcessor( {
								renderDocs: [ matchingDoc.document ],
								saveDocs: [ matchingDoc.document.id ],
								sessionDocs: [ matchingDoc ],
							} );
						} );
					} );
				} );
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

		describe( 'delete', () => {

			let note;

			beforeEach( () => {

				note = {	id: 123 };
				req.note = note;
			} );

			describe( 'A GET request', () => {
				describe( 'An XHR request', () => {
					it( 'Should render the partial with the correct context', async () => {

						req.xhr = true;

						await controller.notes.delete( req, res, next );

						expect( res.render ).toHaveBeenCalledWith( 'barriers/views/partials/delete-note-modal', { note, csrfToken } );
					} );
				} );

				describe( 'A normal request', () => {
					describe( 'With a success resonse', () => {
						it( 'Should render the view with the correct context', async () => {

							await check( controller.notes.delete, false, {
								isDelete: true,
								currentNote: note,
								csrfToken,
							} );
						} );
					} );
				} );
			} );

			describe( 'A POST', () => {

				beforeEach( () => {

					req.method = 'POST';
				} );

				describe( 'When the service rejects', () => {
					it( 'Should call next with an error', async () => {

						const err = new Error( 'some rejection' );

						backend.barriers.notes.delete.and.callFake( () => Promise.reject( err ) );

						await controller.notes.delete( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
						expect( res.render ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'When the service resolves', () => {
					describe( 'When it is a success', () => {
						it( 'Should redirect to the detail page', async () => {

							const detailResponse = { detail: true };

							urls.barriers.detail.and.callFake( () => detailResponse );
							backend.barriers.notes.delete.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );

							await controller.notes.delete( req, res, next );

							expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
							expect( urls.barriers.detail ).toHaveBeenCalledWith( barrierId );
						} );
					} );

					describe( 'When it is a 500', () => {
						it( 'Should call next with an error', async () => {

							const statusCode = 500;

							backend.barriers.notes.delete.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

							await controller.notes.delete( req, res, next );

							expect( res.redirect ).not.toHaveBeenCalled();
							expect( next ).toHaveBeenCalled();
							expect( next.calls.argsFor( 0 )[ 0 ] instanceof HttpResponseError ).toEqual( true );
						} );
					} );
				} );
			} );
		} );

		describe( 'documents', () => {

			let barrierId;
			let noteId;
			let documentId;

			beforeEach( () => {

				barrierId = uuid();
				documentId = uuid();
				noteId = 123;

				req.uuid = barrierId;
				req.note = { id: noteId };
				req.params.id = documentId;
			} );

			describe( 'add', () => {
				it( 'Uses the documentControllers and adds the document to the session', async () => {

					const document = { type: 'text/plain', size: 10, name: 'test-1.txt' };

					req.body.document = document;

					expect( controller.notes.documents.add ).toEqual( documentControllers.xhr.add.cb );

					documentControllers.xhr.add.calls.argsFor( 1 )[ 0 ]( req, { ...document, id: documentId } );

					expect( req.session.noteDocuments ).toBeDefined();
					expect( req.session.noteDocuments[ noteId ] ).toEqual( [{ document: {
						...document,
						id: documentId,
					} }] );
				} );
			} );

			describe( 'delete', () => {

				it( 'Uses the documentControllers', () => {

					const editNoteUrlResponse = 'a/b/c';
					urls.barriers.notes.edit.and.returnValue( editNoteUrlResponse );

					expect( controller.notes.documents.delete ).toEqual( documentControllers.delete.cb );

					const args = documentControllers.delete.calls.argsFor( 0 );

					expect( typeof args[ 0 ] ).toEqual( 'function' );
					expect( typeof args[ 1 ] ).toEqual( 'function' );
					expect( typeof args[ 2 ] ).toEqual( 'function' );

					expect( args[ 0 ]( req ) ).toEqual( documentId );
					expect( args[ 1 ]( req ) ).toEqual( editNoteUrlResponse );
					expect( urls.barriers.notes.edit ).toHaveBeenCalledWith( barrierId, noteId );
				} );

				describe( 'When there are not any documents in the session', () => {
					it( 'Should return the response in JSON', async () => {

						documentControllers.delete.calls.argsFor( 0 )[ 2 ]( req, documentId );

						expect( req.session.noteDocuments ).not.toBeDefined();
					} );
				} );

				describe( 'When there are documents in the session', () => {
					it( 'Should remove the matching document', async () => {

						const nonMatchingDoc1 = { document: { id: uuid(), name: 'test1.txt'} };
						const matchingDoc = { document: { id: documentId, name: 'match1.txt' } };

						req.session.noteDocuments = { [ noteId ]: [ nonMatchingDoc1, matchingDoc ] };

						documentControllers.delete.calls.argsFor( 0 )[ 2 ]( req, documentId );

						expect( req.session.noteDocuments[ noteId ] ).toEqual( [ nonMatchingDoc1 ] );
					} );
				} );
			} );

			describe( 'cancel', () => {

				let detailResponse;

				beforeEach( () => {

					detailResponse = '/barrier/detail';
					urls.barriers.detail.and.callFake( () => detailResponse );
				} );

				afterEach( () => {

					expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
					expect( urls.barriers.detail ).toHaveBeenCalledWith( barrierId );
				} );

				describe( 'When there are documents in the session', () => {
					it( 'Should remove the documents and redirect', () => {

						req.session.noteDocuments = [
							{ noteId, document: { id: uuid() } } ,
							{ noteId, document: { id: uuid() } }
						];

						controller.notes.documents.cancel( req, res );

						expect( req.session.noteDocuments[ noteId ] ).not.toBeDefined();
					} );
				} );

				describe( 'When there are no documents in the session', () => {
					it( 'Should redirect to the detail page', () => {

						controller.notes.documents.cancel( req, res );
					} );
				} );
			} );
		} );
	} );

	describe( 'documents (AJAX)', () => {

		let barrierId;
		let documentId;

		beforeEach( () => {

			barrierId = uuid();
			documentId = uuid();

			req.uuid = barrierId;
			req.params.id = documentId;
		} );

		describe( 'add', () => {

			describe( 'When there are not any documents in the session', () => {
				it( 'Uses the documentControllers and adds the document to the session', async () => {

					const existingItem = { barrierId: uuid(), document: { id: uuid() } };
					const document = { type: 'text/plain', size: 10, name: 'test-1.txt' };

					req.body.document = document;
					req.session.barrierDocuments = [ existingItem ];

					expect( controller.documents.add ).toEqual( documentControllers.xhr.add.cb );

					documentControllers.xhr.add.calls.argsFor( 0 )[ 0 ]( req, { ...document, id: documentId } );

					expect( req.session.barrierDocuments ).toEqual( [
						existingItem,
						{
							barrierId,
							document: {
								...document,
								id: documentId,
							}
						}
					] );
				} );
			} );

			describe( 'When there are documents in the session', () => {
				it( 'Uses the documentControllers and adds the document to the session', async () => {

					const document = { type: 'text/plain', size: 10, name: 'test-1.txt' };

					req.body.document = document;

					expect( controller.documents.add ).toEqual( documentControllers.xhr.add.cb );

					documentControllers.xhr.add.calls.argsFor( 0 )[ 0 ]( req, { ...document, id: documentId } );

					expect( req.session.barrierDocuments ).toEqual( [{
						barrierId,
						document: {
							...document,
							id: documentId,
						}
					}] );
				} );
			} );
		} );

		describe( 'delete', () => {

			it( 'Uses the documentControllers', () => {

				expect( controller.documents.delete ).toEqual( documentControllers.xhr.delete.cb );
				const args = documentControllers.xhr.delete.calls.argsFor( 0 );
				expect( typeof args[ 0 ] ).toEqual( 'function' );
				expect( typeof args[ 1 ] ).toEqual( 'function' );
				expect( args[ 0 ]( req ) ).toEqual( documentId );
			} );

			describe( 'When there are barrier documents in the session', () => {
				it( 'Should remove the document from the session', () => {

					const nonMatchingDoc1 = { id: uuid(), name: 'test1.jpg' };
					const matchingDoc = { id: documentId, name: 'match.txt' };

					req.session.barrierDocuments = [
						{ barrierId, document: nonMatchingDoc1 },
						{ barrierId, document: matchingDoc }
					];

					documentControllers.xhr.delete.calls.argsFor( 0 )[ 1 ]( req, documentId );

					expect( req.session.barrierDocuments ).toEqual( [ { barrierId, document: nonMatchingDoc1 } ] );
				} );
			} );

			describe( 'When there are no documents in the session', () => {
				it( 'Should not error and have no documents in the session', () => {

					documentControllers.xhr.delete.calls.argsFor( 0 )[ 1 ]( req, documentId );

					expect( req.session.barrierDocuments ).not.toBeDefined();
				} );
			} );
		} );

		describe( 'cancel', () => {

			let detailResponse;

			beforeEach( () => {

				req.uuid = barrierId;
				urls.barriers.detail.and.callFake( () => detailResponse );
			} );

			afterEach( () => {

				expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
				expect( urls.barriers.detail ).toHaveBeenCalledWith( barrierId );
			} );

			describe( 'When there are documents in the session', () => {
				it( 'Should remove ones matched to the current barrier and redirect to the barrier detail', () => {

					const nonMatchingDoc = { barrierId: uuid(), document: { id: uuid() } };
					const matchingDoc1 = { barrierId, document: { id: uuid() } };
					const matchingDoc2 = { barrierId, document: { id: uuid() } };

					req.session.barrierDocuments = [
						nonMatchingDoc,
						matchingDoc1,
						matchingDoc2,
					];

					controller.documents.cancel( req, res );

					expect( req.session.barrierDocuments ).toEqual( [ nonMatchingDoc ] );
				} );
			} );

			describe( 'When there are no documents in the session', () => {
				it( 'Should redirect to the barrier detail', () => {

					controller.documents.cancel( req, res );
				} );
			} );
		} );
	} );
} );
