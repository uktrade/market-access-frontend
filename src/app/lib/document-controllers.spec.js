const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const HttpResponseError = require( './HttpResponseError' );
const modulePath = './document-controllers';

const { mocks } = jasmine.helpers;
const DELETE_ERROR_MESSAGE = 'A system error has occured, so the file has not been deleted. Try again.';

describe( 'document controllers', () => {

	let controllers;
	let config;
	let reporter;
	let validators;
	let uploadDocument;
	let backend;

	beforeEach( () => {

		config = {
			files: {
				maxSize: ( 5 * 1024 * 1024 ),
				types: [ 'image/jpeg', 'text/csv' ]
			}
		};

		reporter = mocks.reporter();

		validators = {
			isValidFile: jasmine.createSpy( 'validators.isValidFile' ),
			isUuid: jasmine.createSpy( 'validators.isUuid' ),
		};

		uploadDocument = jasmine.createSpy( 'uploadDocument' );

		backend = {
			documents: {
				getScanStatus: jasmine.createSpy( 'backend.documents.getScanStatus' ),
				delete: jasmine.createSpy( 'backend.documents.delete' ),
			},
		};
	} );

	describe( 'With a missing mime type map', () => {
		it( 'Should report the error', () => {

			config.files.types.push( 'fake/mime' );

			proxyquire( modulePath, {
				'../config': config,
				'./reporter': reporter,
				'./validators': validators,
				'./upload-document': uploadDocument,
				'./backend-service': backend,
			} );

			expect( reporter.message ).toHaveBeenCalledWith( 'info', 'No file extension mapping found for valid type: fake/mime'  );
		} );
	} );

	describe( 'Without missing mime types', () => {

		let req;
		let res;
		let next;

		beforeEach( () => {

			({ req, res, next } = mocks.middleware());

			controllers = proxyquire( modulePath, {
				'../config': config,
				'./reporter': reporter,
				'./validators': validators,
				'./upload-document': uploadDocument,
				'./backend-service': backend,
			} );
		} );

		it( 'Does not report any missing mappings', () => {

			expect( reporter.message ).not.toHaveBeenCalled();
		} );

		describe( 'constants', () => {
			it( 'Defines them correctly', () => {

				expect( controllers.MAX_FILE_SIZE ).toBeDefined();
				expect( controllers.OVERSIZE_FILE_MESSAGE ).toBeDefined();
				expect( controllers.INVALID_FILE_TYPE_MESSAGE ).toBeDefined();
				expect( controllers.UPLOAD_ERROR_MESSAGE ).toBeDefined();
				expect( controllers.FILE_INFECTED_MESSAGE ).toBeDefined();
			} );
		} );

		describe( 'reportInvalidFile', () => {
			it( 'Reports a file to the reporter', () => {

				const file = { type: 'text/plain', size: 100, name: 'text-doc.txt' };

				controllers.reportInvalidFile( file );

				expect( reporter.message ).toHaveBeenCalledWith( 'info', 'Invalid document type: ' + file.type, { size: file.size, name: file.name } );
			} );
		} );

		describe( 'controllers', () => {

			let documentId;

			beforeEach( () => {

				documentId = uuid();
			} );

			describe( 'xhr', () => {
				describe( '#add', () => {

					let controller;
					let passedCb;

					beforeEach( () => {

						passedCb = jasmine.createSpy( 'passedCb' );
						controller = controllers.xhr.add( passedCb );
					} );

					describe( 'When there is a formError on the req', () => {
						describe( 'When the error is about file size', () => {
							it( 'Should return a 400 with a message', async () => {

								req.formError = new Error( 'The error is maxFileSize exceeded' );

								await controller( req, res );

								expect( res.status ).toHaveBeenCalledWith( 400 );
								expect( res.json ).toHaveBeenCalledWith( { message: 'File size exceeds the 5 MB limit. Reduce file size and upload the document again.' } );
								expect( reporter.message ).not.toHaveBeenCalled();
								expect( reporter.captureException ).not.toHaveBeenCalled();
							} );
						} );

						describe( 'When the error is about something else', () => {
							it( 'Should return a 400 with a message', async () => {

								req.formError = new Error( 'The error is something else' );

								await controller( req, res );

								expect( res.status ).toHaveBeenCalledWith( 400 );
								expect( res.json ).toHaveBeenCalledWith( { message: 'A system error has occured, so the file has not been uploaded. Try again.' } );
								expect( reporter.captureException ).toHaveBeenCalledWith( req.formError );
							} );
						} );
					} );

					describe( 'When there is not a formError', () => {
						describe( 'When there is not a document', () => {
							it( 'Should return a 400 with an error message', async () => {

								await controller( req, res );

								expect( res.status ).toHaveBeenCalledWith( 400 );
								expect( res.json ).toHaveBeenCalledWith( { message: 'Unsupported file format. The following file formats are accepted .jpg, .csv' } );
								expect( reporter.message ).toHaveBeenCalledWith( 'info', 'Invalid document type: undefined', { size: undefined, name: undefined } );
							} );
						} );

						describe( 'When there is a document', () => {

							let doc;

							beforeEach( () => {

								doc = { type: 'text/plain', size: 10, name: 'test-1.txt' };
								req.body.document = doc;
							} );

							describe( 'When the document is invalid', () => {
								it( 'Should return 400 with an error message', async () => {

									validators.isValidFile.and.callFake( () => false );

									await controller( req, res );

									expect( res.status ).toHaveBeenCalledWith( 400 );
									expect( res.json ).toHaveBeenCalledWith( { message: 'Unsupported file format. The following file formats are accepted .jpg, .csv' } );
									expect( reporter.message ).toHaveBeenCalledWith( 'info', `Invalid document type: ${ doc.type }`, { size: doc.size, name: doc.name } );
								} );
							} );

							describe( 'When the document is valid', () => {

								beforeEach( () => {

									validators.isValidFile.and.callFake( () => true );
								} );

								describe( 'When uploadDocument returns an error', () => {
									it( 'Should return a 500', async () => {

										const err = new Error( 'uploadDocument error' );

										uploadDocument.and.callFake( () => Promise.reject( err ) );

										await controller( req, res );

										expect( res.status ).toHaveBeenCalledWith( 500 );
										expect( res.json ).toHaveBeenCalledWith( { message: 'A system error has occured, so the file has not been uploaded. Try again.' } );
										expect( reporter.captureException ).toHaveBeenCalledWith( err );
									} );
								} );

								describe( 'When uploadDocument returns a documentId', () => {

									let documentId;

									beforeEach( () => {

										documentId = uuid();
										uploadDocument.and.callFake( () => documentId );
									} );

									describe( 'When the document does not pass virus scanning', () => {
										it( 'Should return a 401', async () => {

											backend.documents.getScanStatus.and.callFake( () => Promise.resolve( { passed: false } ) );

											await controller( req, res );

											expect( res.status ).toHaveBeenCalledWith( 401 );
											expect( res.json ).toHaveBeenCalledWith( { message: 'This file may be infected with a virus and will not be accepted.' } );
										} );
									} );

									describe( 'When the document passes virus scanning', () => {
										it( 'Should return the document details and add the document to the session', async () => {

											backend.documents.getScanStatus.and.callFake( () => Promise.resolve( { passed: true } ) );

											await controller( req, res );

											expect( res.json ).toHaveBeenCalledWith( {
												documentId,
												file: { name: doc.name, size: '10 Bytes' }
											} );

											passedCb( documentId, doc );
										} );
									} );
								} );
							} );
						} );
					} );
				} );

				describe( '#delete', () => {

					let successCb;
					let getDocumentId;

					beforeEach( () => {

						successCb = jasmine.createSpy( 'successCb' );
						getDocumentId = jasmine.createSpy( 'getDocumentId' ).and.returnValue( documentId );
					} );

					describe( 'When the uuid is invalid', () => {
						it( 'Throws an error', () => {

							validators.isUuid.and.returnValue( false );

							controllers.xhr.delete( getDocumentId, successCb )( req, res );

							expect( successCb ).not.toHaveBeenCalled();
							expect( res.status ).toHaveBeenCalledWith( 500 );
							expect( res.json ).toHaveBeenCalledWith( { message: DELETE_ERROR_MESSAGE } );
							expect( reporter.captureException ).toHaveBeenCalledWith( new Error( 'Invalid documentId' ) );
						} );
					} );

					describe( 'When the uuid is valid', () => {

						let controller;

						beforeEach( () => {

							validators.isUuid.and.returnValue( true );
							controller = controllers.xhr.delete( getDocumentId, successCb );
						} );

						afterEach( () => {

							expect( backend.documents.delete ).toHaveBeenCalledWith( req, documentId );
						} );

						describe( 'When the backend returns an error', () => {
							it( 'Should return a JSON error with status 500', async () => {

								const err = new Error( 'A backend error' );
								backend.documents.delete.and.callFake( () => Promise.reject( err ) );

								await controller( req, res );

								expect( res.status ).toHaveBeenCalledWith( 500 );
								expect( res.json ).toHaveBeenCalledWith( { message: DELETE_ERROR_MESSAGE } );
								expect( reporter.captureException ).toHaveBeenCalledWith( err );
								expect( successCb ).not.toHaveBeenCalled();
							} );
						} );

						describe( 'When the backend returns a 200', () => {
							describe( 'When there are not any documents in the session', () => {
								it( 'Should return the response in JSON', async () => {

									backend.documents.delete.and.callFake( () => Promise.resolve( {
										response: { isSuccess: true }
									} ) );

									await controller( req, res );

									expect( res.json ).toHaveBeenCalledWith( {} );
									expect( successCb ).toHaveBeenCalledWith( req, documentId );
								} );
							} );
						} );

						describe( 'When the backend returns a 500', () => {
							describe( 'When there are not any documents in the session', () => {
								it( 'Should return a 500 and report the error in JSON', async () => {

									backend.documents.delete.and.callFake( () => Promise.resolve( {
										response: { isSuccess: false, statusCode: 500 }
									} ) );

									await controller( req, res );

									expect( res.status ).toHaveBeenCalledWith( 500 );
									expect( res.json ).toHaveBeenCalledWith( { message: DELETE_ERROR_MESSAGE } );
									expect( reporter.captureException ).toHaveBeenCalled();
									expect( reporter.captureException.calls.argsFor( 0 )[ 0 ] instanceof HttpResponseError ).toEqual( true );
								} );
							} );
						} );
					} );
				} );
			} );

			describe( '#delete', () => {

				let successCb;
				let getDocumentId;
				let getRedirectUrl;
				let controller;

				beforeEach( () => {

					successCb = jasmine.createSpy( 'successCb' );
					getDocumentId = jasmine.createSpy( 'getDocumentId' ).and.returnValue( documentId );
					getRedirectUrl = jasmine.createSpy( 'getRedirectUrl' );

					controller = controllers.delete( getDocumentId, getRedirectUrl, successCb );
				} );

				describe( 'When the document id is invalid', () => {

					beforeEach( () => {

						validators.isUuid.and.callFake( () => false );
					} );

					describe( 'A normal request', () => {
						it( 'Calls next with an error', async () => {

							await controller( req, res, next );

							expect( next ).toHaveBeenCalledWith( new Error( 'Invalid documentId' ) );
						} );
					} );

					describe( 'An XHR request', () => {
						it( 'Should return a 500 and report the error', async () => {

							req.xhr = true;

							await controller( req, res, next );

							expect( res.status ).toHaveBeenCalledWith( 500 );
							expect( res.json ).toHaveBeenCalledWith( { message: DELETE_ERROR_MESSAGE } );
							expect( reporter.captureException ).toHaveBeenCalledWith( new Error( 'Invalid documentId' ) );
						} );
					} );
				} );

				describe( 'When the document id is valid', () => {

					beforeEach( () => {

						validators.isUuid.and.callFake( () => true );
						req.xhr = true;
					} );

					describe( 'When the backend delete rejects', () => {
						it( 'Should return a 500 with the correct message', async () => {

							const err = new Error( 'A backend fail' );

							backend.documents.delete.and.callFake( () => Promise.reject( err ) );

							await controller( req, res, next );

							expect( res.status ).toHaveBeenCalledWith( 500 );
							expect( res.json ).toHaveBeenCalledWith( { message: DELETE_ERROR_MESSAGE } );
							expect( reporter.captureException ).toHaveBeenCalledWith( err );
						} );
					} );

					describe( 'When the backend resolves', () => {

						beforeEach( () => {

							req.xhr = true;
						} );

						describe( 'When it is a 500', () => {
							it( 'Should report the error', async() => {

								backend.documents.delete.and.callFake( () => Promise.resolve( { response: { statusCode: 500 } } ) );

								await controller( req, res, next );

								expect( res.status ).toHaveBeenCalledWith( 500 );
								expect( res.json ).toHaveBeenCalledWith( { message: 'A system error has occured, so the file has not been deleted. Try again.' } );
								expect( reporter.captureException ).toHaveBeenCalled();
								expect( reporter.captureException.calls.argsFor( 0 )[ 0 ] instanceof HttpResponseError ).toEqual( true );
							} );
						} );

						describe( 'When it is a 200', () => {
							it( 'Calls the successCb', async () => {

								backend.documents.delete.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );

								await controller( req, res, next );

								expect( res.json ).toHaveBeenCalledWith( {} );
								expect( successCb ).toHaveBeenCalledWith( req, documentId );
							} );
						} );

						describe( 'When it is a 400', () => {
							it( 'Calls the successCb', async () => {

								backend.documents.delete.and.callFake( () => Promise.resolve( { response: { statusCode: 400 } } ) );

								await controller( req, res, next );

								expect( res.json ).toHaveBeenCalledWith( {} );
								expect( successCb ).toHaveBeenCalledWith( req, documentId );
							} );
						} );
					} );
				} );
			} );
		} );
	} );
} );
