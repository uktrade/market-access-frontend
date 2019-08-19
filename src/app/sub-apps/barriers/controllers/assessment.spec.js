const proxyquire = require( 'proxyquire' );
const faker = require( 'faker' );
const fileSize = require( '../../../lib/file-size' );
const HttpResponseError = require( '../../../lib/HttpResponseError' );
const modulePath = './assessment';
const { mocks, getFakeData } = jasmine.helpers;

describe( 'Assessment controller', () => {

	let controller;
	let backend;
	let req;
	let res;
	let next;
	let barrier;
	let barrierDetailViewModel;
	let metadata;
	let urls;
	let documentControllers;
	let barrierSession;
	let getValuesResponse;
	let getTemplateValuesResponse;
	let form;
	let Form;
	let FormProcessor;
	let validators;

	beforeEach( () => {

		({ req, res, next } = mocks.middleware());
		documentControllers = mocks.documentControllers();
		barrierSession = mocks.barrierSession();
		({ getValuesResponse, getTemplateValuesResponse, form, Form } = mocks.form() );
		FormProcessor = mocks.formProcessor();

		backend = {
			barriers: {
				assessment: {
					get: jasmine.createSpy( 'backend.barriers.assessment.get' ),
					saveEconomyValue: jasmine.createSpy( 'backend.barriers.assessment.saveEconomyValue' ),
					saveMarketSize: jasmine.createSpy( 'backend.barriers.assessment.saveMarketSize' ) ,
					saveExportValue: jasmine.createSpy( 'backend.barriers.assessment.saveExportValue' ) ,
					saveCommercialValue: jasmine.createSpy( 'backend.barriers.assessment.saveCommercialValue' ),
				}
			}
		};

		metadata = {
			documentStatus: {
				virus_scanned: 'scanned'
			},
			barrierAssessmentImpactOptions: {
				THREE: 'Three text',
			},
		};

		barrier = {
			id: faker.random.uuid(),
			title: faker.lorem.words(),
		};

		urls = {
			barriers: {
				assessment: {
					detail: jasmine.createSpy( 'urls.barriers.assessment.detail' ),
				}
			}
		};

		barrierDetailViewModel = jasmine.createSpy( 'barrierDetailViewModel' );

		validators = {
			isNumeric: jasmine.createSpy( 'validators.isNumeric' ),
		};

		req.barrier = barrier;
		req.barrierSession = barrierSession;

		controller = proxyquire( modulePath, {
			'../../../lib/metadata': metadata,
			'../../../lib/backend-service': backend,
			'../view-models/detail': barrierDetailViewModel,
			'../../../lib/urls': urls,
			'../../../lib/document-controllers': documentControllers,
			'../../../lib/Form': Form,
			'../../../lib/FormProcessor': FormProcessor,
			'../../../lib/validators': validators,
		} );
	} );

	describe( '#detail', () => {

		const template = 'barriers/views/assessment/detail';

		describe( 'When the backend call rejects', () => {
			it( 'Calls next with an error', async () => {

				const err = new Error( 'A backend assessment issue' );

				backend.barriers.assessment.get.and.returnValue( Promise.reject( err ) );
				await controller.detail( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
			} );
		} );

		describe( 'When the backend resolves with a 500', () => {
			it( 'Calls next with an error', async () => {

				backend.barriers.assessment.get.and.returnValue( mocks.request( 500 ) );

				await controller.detail( req, res, next );

				expect( next ).toHaveBeenCalled();
				expect( next.calls.argsFor( 0 )[ 0 ] instanceof HttpResponseError ).toEqual( true );
			} );
		} );

		describe( 'When the backend resolves with a 404', () => {
			it( 'Renders the assessment detail', async () => {

				const barrierDetailViewModelResponse = { d: 1, e: 2 };

				backend.barriers.assessment.get.and.returnValue( mocks.request( 404 ) );
				barrierDetailViewModel.and.returnValue( barrierDetailViewModelResponse );

				await controller.detail( req, res, next );

				expect( res.render ).toHaveBeenCalledWith( template, barrierDetailViewModelResponse );
				expect( barrierDetailViewModel ).toHaveBeenCalledWith( barrier );
			} );
		} );

		describe( 'When the backend resolves with a 200', () => {
			it( 'Renders the assessment detail with the assessment data', async () => {

				const barrierDetailViewModelResponse = { e: 1, f: 2 };
				const assessment = getFakeData( '/backend/barriers/assessment' );

				backend.barriers.assessment.get.and.returnValue( mocks.request( 200, assessment ) );
				barrierDetailViewModel.and.returnValue( barrierDetailViewModelResponse );

				await controller.detail( req, res, next );

				expect( res.render ).toHaveBeenCalledWith( template, {
					...barrierDetailViewModelResponse,
					assessment,
					impact: {
						text: metadata.barrierAssessmentImpactOptions[ assessment.impact ],
						id: assessment.impact,
					},
					documents: assessment.documents.map( ( doc ) => ({
						id: doc.id,
						name: doc.name,
						size: fileSize( doc.size ),
						canDownload: ( doc.status === 'virus_scanned' ),
						status: metadata.documentStatus[ doc.status ]
					}) ),
				} );
				expect( barrierDetailViewModel ).toHaveBeenCalledWith( barrier );
				expect( next ).not.toHaveBeenCalled();
			} );
		} );
	} );

	describe( 'documents', () => {

		let barrierId;
		let noteId;
		let documentId;

		beforeEach( () => {

			barrierId = faker.random.uuid();
			documentId = faker.random.uuid();
			noteId = 123;

			req.uuid = barrierId;
			req.note = { id: noteId };
			req.params.id = documentId;
		} );

		describe( 'add', () => {
			it( 'Uses the documentControllers and adds the document to the session', async () => {

				const document = { type: 'text/plain', size: 10, name: 'test-1.txt' };
				const mockDocuments = [];

				req.body.document = document;
				barrierSession.documents.assessment.get.and.returnValue( mockDocuments );

				expect( controller.documents.add ).toEqual( documentControllers.xhr.add.cb );

				documentControllers.xhr.add.calls.argsFor( 0 )[ 0 ]( req, { ...document, id: documentId } );

				expect( barrierSession.documents.assessment.setIfNotAlready ).toHaveBeenCalledWith( [] );
				expect( barrierSession.documents.assessment.get ).toHaveBeenCalledWith();
				expect( mockDocuments ).toEqual( [ {
					...document,
					id: documentId
				} ] );
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

					const nonMatchingDoc1 = { id: faker.random.uuid(), name: 'test1.jpg' };
					const matchingDoc = { id: documentId, name: 'match.txt' };
					const mockDocuments = [
						nonMatchingDoc1,
						matchingDoc,
					];

					barrierSession.documents.assessment.get.and.returnValue( mockDocuments );
					documentControllers.xhr.delete.calls.argsFor( 0 )[ 1 ]( req, documentId );

					expect( barrierSession.documents.assessment.set ).toHaveBeenCalledWith( [ nonMatchingDoc1 ] );
				} );
			} );

			describe( 'When there are no documents in the session', () => {
				it( 'Should not error and have no documents in the session', () => {

					documentControllers.xhr.delete.calls.argsFor( 0 )[ 1 ]( req, documentId );

					expect( barrierSession.documents.assessment.set ).not.toHaveBeenCalled();
				} );
			} );
		} );

		describe( 'cancel', () => {
			describe( 'When there are documents in the session', () => {
				it( 'Should remove ones matched to the current barrier and redirect to the barrier detail', () => {

					const detailResponse = 'detail/x/y/z';
					urls.barriers.assessment.detail.and.returnValue( detailResponse );

					controller.documents.cancel( req, res );

					expect( barrierSession.documents.assessment.delete ).toHaveBeenCalled();
					expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
					expect( urls.barriers.assessment.detail ).toHaveBeenCalledWith( barrierId );
				} );
			} );
		} );
	} );

	function checkValueController( templateName, serviceMethod ){

		const template = `barriers/views/assessment/${ templateName }`;
		const backendMethod = backend.barriers.assessment[ serviceMethod ];
		const detailResponse = '/a/detail/page';

		urls.barriers.assessment.detail.and.returnValue( detailResponse );

		const formArgs = Form.calls.argsFor( 0 );
		const formConfig = formArgs[ 1 ];

		expect( formArgs[ 0 ] ).toEqual( req );
		expect( formConfig.value ).toBeDefined();
		expect( formConfig.value.required ).toBeDefined();
		expect( formConfig.value.validators.length ).toEqual( 1 );
		expect( formConfig.value.validators[ 0 ].fn ).toEqual( validators.isNumeric );

		expect( FormProcessor ).toHaveBeenCalled();
		const processorArgs = FormProcessor.calls.argsFor( 0 )[ 0 ];

		expect( processorArgs.form ).toEqual( form );
		expect( processorArgs.render ).toBeDefined();
		expect( processorArgs.saveFormData ).toBeDefined();
		expect( processorArgs.saved ).toBeDefined();

		processorArgs.render( getTemplateValuesResponse );

		expect( res.render ).toHaveBeenCalledWith( template, getTemplateValuesResponse );

		processorArgs.saveFormData( getValuesResponse );

		expect( backendMethod ).toHaveBeenCalledWith( req, req.barrier, getValuesResponse.value );

		processorArgs.saved();

		expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
		expect( urls.barriers.assessment.detail ).toHaveBeenCalledWith( barrier.id );

		expect( FormProcessor.processor.process ).toHaveBeenCalled();
	}

	describe( '#economyValue', () => {
		it( 'configures the form processor correctly', async () => {

			await controller.economyValue( req, res, next );

			checkValueController( 'economy-value', 'saveEconomyValue' );
		} );
	} );

	describe( '#marketSize', () => {
		it( 'configures the form processor correctly', async () => {

			await controller.marketSize( req, res, next );

			checkValueController( 'market-size', 'saveMarketSize' );
		} );
	} );

	describe( '#exportValue', () => {
		it( 'configures the form processor correctly', async () => {

			await controller.exportValue( req, res, next );

			checkValueController( 'export-value', 'saveExportValue' );
		} );
	} );

	describe( '#commercialValue', () => {
		it( 'configures the form processor correctly', async () => {

			await controller.commercialValue( req, res, next );

			checkValueController( 'commercial-value', 'saveCommercialValue' );
		} );
	} );
} );
