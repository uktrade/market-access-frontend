const HttpResponseError = require( './HttpResponseError' );
const FormProcessor = require( './FormProcessor' );

describe( 'FormProcessor', () => {

	let form;
	let render;
	let saveFormData;
	let saved;
	let getValuesResponse;
	let getTemplateValuesResponse;

	beforeEach( () => {

		getValuesResponse = { getValues: 1 };
		getTemplateValuesResponse = { getTemplateValues: 1 };
	} );

	describe( 'Without the required params', () => {
		it( 'Should throw an error', () => {

			form = {};
			render = () => {};
			saveFormData = () => {};
			saved = () => {};

			expect( () => new FormProcessor() ).toThrow( new Error( 'form is required' ) );
			expect( () => new FormProcessor( { form } ) ).toThrow( new Error( 'render is required' ) );
			expect( () => new FormProcessor( { form, render } ) ).toThrow( new Error( 'saveFormData is required' ) );
			expect( () => new FormProcessor( { form, render, saveFormData } ) ).toThrow( new Error( 'saved is required' ) );
			expect( () => new FormProcessor( { form, render, saveFormData, saved } ) ).not.toThrow();
		} );
	} );

	describe( 'process', () => {

		beforeEach( () => {

			form = {
				validate: jasmine.createSpy( 'form.validate' ),
				hasErrors: jasmine.createSpy( 'form.hasErrors' ),
				getValues: jasmine.createSpy( 'form.getValues' ).and.callFake( () => getValuesResponse ),
				getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.callFake( () => getTemplateValuesResponse ),
				addErrors: jasmine.createSpy( 'form.addErrors' )
			};

			render = jasmine.createSpy( 'render' );
			saveFormData = jasmine.createSpy( 'saveFormData' );
			saved = jasmine.createSpy( 'saved' );
		} );

		describe( 'a GET', () => {
			it( 'Should render', async () => {

				form.isPost = false;

				const processor = new FormProcessor( { form, render, saveFormData, saved } );

				await processor.process();

				expect( render ).toHaveBeenCalledWith( getTemplateValuesResponse );
			} );
		} );

		describe( 'a POST', () => {

			let processor;
			let bodyResponse;

			beforeEach( () => {

				form.isPost = true;
				bodyResponse = { some: 'data' };

				processor = new FormProcessor( { form, render, saveFormData, saved } );
			} );

			describe( 'With errors', () => {
				it( 'Should call render', async () => {

					form.hasErrors.and.callFake( () => true );

					await processor.process();

					expect( form.validate ).toHaveBeenCalledWith();
					expect( render ).toHaveBeenCalledWith( getTemplateValuesResponse );
				} );
			} );

			describe( 'Without errors', () => {

				beforeEach( () => {

					form.hasErrors.and.callFake( () => false );
				} );

				afterEach( () => {

					expect( form.getValues ).toHaveBeenCalledWith();
					expect( saveFormData ).toHaveBeenCalledWith( getValuesResponse );
				} );

				describe( 'When the response is a 200', () => {
					it( 'Should call saved', async () => {

						saveFormData.and.returnValue( Promise.resolve({
							response: { isSuccess: true, statusCode: 200 },
							body: bodyResponse
						}) );

						await processor.process();

						expect( saved ).toHaveBeenCalledWith( bodyResponse );
					} );
				} );

				describe( 'When the response is a 400', () => {

					let response;
					let err;

					beforeEach( () => {

						err = undefined;
						response = { isSuccess: false, statusCode: 400 };
					} );

					async function runProcessor( checkResponseErrors = true ){

						try {

							await processor.process( { checkResponseErrors } );

						} catch( e ){

							err = e;
						}
					}

					describe( 'When checkResponseErrors is true', () => {
						describe( 'With an empty body', () => {
							it( 'Should throw an error', async () => {

								saveFormData.and.returnValue( Promise.resolve({
									response,
									body: ''
								}) );

								await runProcessor();

								expect( render ).not.toHaveBeenCalled();
								expect( err instanceof HttpResponseError ).toEqual( true );
								expect( err.code ).toEqual( 'UNHANDLED_400' );
							} );
						} );

						describe( 'With a body but no fields', () => {
							it( 'Should throw an error', async () => {

								saveFormData.and.returnValue( Promise.resolve({
									response,
									body: {}
								}) );

								await runProcessor();

								expect( render ).not.toHaveBeenCalled();
								expect( err instanceof HttpResponseError ).toEqual( true );
								expect( err.code ).toEqual( 'UNHANDLED_400' );
							} );
						} );

						describe( 'A body with fields', () => {

							beforeEach( () => {

								saveFormData.and.returnValue( Promise.resolve({
									response,
									body: { fields: { a: 1, b: 2 } }
								}) );
							} );

							describe( 'When the second call to hasErrors returns true', () => {
								it( 'Should render', async () => {

									form.addErrors.and.callFake( () => form.hasErrors.and.returnValue( true ) );

									await runProcessor();

									expect( err ).not.toBeDefined();
									expect( render ).toHaveBeenCalledWith( getTemplateValuesResponse );
								} );
							} );

							describe( 'When the second call to hasErrors returns false', () => {
								it( 'Should throw an error', async () => {

									form.addErrors.and.callFake( () => form.hasErrors.and.returnValue( false ) );

									await runProcessor();

									expect( render ).not.toHaveBeenCalled();
									expect( err instanceof HttpResponseError ).toEqual( true );
									expect( err.code ).not.toBeDefined();
								} );
							} );
						} );
					} );

					describe( 'When checkResponseErrors is false', () => {
						it( 'Should throw an error', async () => {

							saveFormData.and.returnValue( Promise.resolve({
								response,
								body: { fields: { a: 1, b: 2 } }
							}) );

							await runProcessor( false );

							expect( render ).not.toHaveBeenCalled();
							expect( err instanceof HttpResponseError ).toEqual( true );
							expect( err.code ).toEqual( 'UNHANDLED_400' );
						} );
					} );
				} );
			} );
		} );
	} );
} );
