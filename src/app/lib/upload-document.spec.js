const uuid = require( 'uuid/v4' );
const proxyquire = require( 'proxyquire' );

const modulePath = './upload-document';

describe( 'uploadDocument', () => {

	let backend;
	let signed_upload_url;
	let document;
	let documentId;
	let req;
	let uploadFile;
	let reporter;
	let uploadDocument;

	beforeEach( async () => {

		backend = {
			documents: {
				create: jasmine.createSpy( 'backend.documents.create' ),
				uploadComplete: jasmine.createSpy( 'backend.documents.uploadComplete' ),
			}
		};
		req = jasmine.helpers.mocks.req();
		reporter = jasmine.helpers.mocks.reporter();
		uploadFile = jasmine.createSpy( 'uploadFile' );
		documentId = uuid();
		signed_upload_url = 'a/b/c';
		document = { name: 'a document', size: 12 };

		uploadDocument = proxyquire( modulePath, {
			'./upload-file': uploadFile,
			'./reporter': reporter,
			'./backend-service': backend,
		} );
	} );

	describe( 'When backend.documents.create rejects', () => {
		it( 'Should call next with an error', async () => {

			const err = new Error( 'My test' );

			backend.documents.create.and.callFake( () => Promise.reject( err ) );

			try {

				await uploadDocument( req, document );
				fail();

			} catch( e ){

				expect( e ).toEqual( err );
			}
		} );
	} );

	describe( 'When backend.documents.create resolves', () => {
		describe( 'When it is not a success', () => {
			it( 'Should reject with an error', async () => {

				backend.documents.create.and.callFake( () => Promise.resolve( { response: { isSuccess: false } } ) );

				try {

					await uploadDocument( req, document );
					fail();

				} catch( e ){

					expect( e ).toEqual( new Error( 'Could not create document' ) );
				}
			} );
		} );

		describe( 'When it is a success', () => {

			beforeEach( () => {

				backend.documents.create.and.callFake( () => Promise.resolve( { response: {
					isSuccess: true
				}, body: {
					id: documentId,
					signed_upload_url,
				} }));
			} );

			afterEach( () => {

				expect( backend.documents.create ).toHaveBeenCalledWith( req, document.name, document.size );
				expect( uploadFile ).toHaveBeenCalledWith( signed_upload_url, document );
			} );

			describe( 'When uploadFile rejects', () => {
				it( 'Should reject with an error and report the error', async () => {

					const err = new Error( 'uploadFile rejection' );

					uploadFile.and.callFake( () => Promise.reject( err ) );

					try {

						await uploadDocument( req, document );
						fail();

					} catch( e ){

						expect( e ).toEqual( err );
						expect( reporter.captureException ).toHaveBeenCalledWith( err, { documentId } );
					}
				} );
			} );

			describe( 'When uploadFile resolves', () => {
				describe( 'When it resolves with a 500', () => {
					it( 'Should reject with an error and report the error', async () => {

						const statusCode = 500;
						const body = { myResponse: 500 };

						uploadFile.and.callFake( () => Promise.resolve( {
							response: { statusCode, body },
						} ) );

						try {

							await uploadDocument( req, document );
							fail();

						} catch( e ){

							expect( e ).toEqual( new Error( 'Unable to upload document to S3') );
							expect( reporter.captureException ).toHaveBeenCalledWith( e, {
								response: {
									statusCode,
									body,
									documentId,
								}
							} );
						}
					} );
				} );

				describe( 'When it resolves with a 200', () => {

					beforeEach( () => {
						uploadFile.and.callFake( () => Promise.resolve( {
							response: { statusCode: 200 },
						} ) );
					} );

					afterEach( () => {
						expect( backend.documents.uploadComplete ).toHaveBeenCalledWith( req, documentId );
					} );

					describe( 'When uploadComplete rejects', () => {
						it( 'Should reject and report the error', async () => {

							const err = new Error( 'uploadComplete rejection' );

							backend.documents.uploadComplete.and.callFake( () => Promise.reject( err ) );

							try {

								await uploadDocument( req, document );
								fail();

							} catch( e ){

								expect( e ).toEqual( err );

								expect( reporter.captureException ).toHaveBeenCalledWith( e, { documentId } );
							}
						} );
					} );

					describe( 'When uploadComplete resolves', () => {
						describe( 'When it is not a success', () => {
							it( 'Should reject and report the errro', async () => {

								const statusCode = 500;

								backend.documents.uploadComplete.and.callFake( () => Promise.resolve( {
									response: { isSuccess: false, statusCode },
								} ) );

								try {

									await uploadDocument( req, document );
									fail();

								} catch( e ){

									const err = new Error( 'Unable to complete upload' );

									expect( e ).toEqual( err );
									expect( reporter.captureException ).toHaveBeenCalledWith( err, {
										response: {
											statusCode,
											documentId,
										}
									} );
								}
							} );
						} );
						describe( 'When it is a success', () => {
							it( 'Should resolve with the documentId', async () => {

								backend.documents.uploadComplete.and.callFake( () => Promise.resolve( {
									response: { isSuccess: true },
								} ) );

								try {

									const id = await uploadDocument( req, document );

									expect( id ).toEqual( documentId );

								} catch( e ){

									fail( e );
								}
							} );
						} );
					} );
				} );
			} );
		} );
	} );
} );
