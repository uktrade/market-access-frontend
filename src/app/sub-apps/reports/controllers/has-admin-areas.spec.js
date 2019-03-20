const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

const modulePath = './has-admin-areas';

describe( 'Report controllers', () => {

	let controller;
	let req;
	let res;
	let next;
	let Form;
	let form;
	let urls;
	let metadata;
	let validators;
	let backend;
	let govukItemsFromObj;
	let govukItemsFromObjResponse;
	let getValuesResponse;
	let getTemplateValuesResponse;

	beforeEach( () => {

		( { req, res, next } = jasmine.helpers.mocks.middleware() );

		govukItemsFromObjResponse = [ { items: 1 } ];
		getValuesResponse = { a: 1, b: 2 };
		getTemplateValuesResponse = { c: 3, d: 4 };
		form = {
			hasErrors: jasmine.createSpy( 'form.hasErrors' ),
			validate: jasmine.createSpy( 'form.validate' ),
			getValues: jasmine.createSpy( 'form.getValues' ).and.callFake( () => getValuesResponse ),
			getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.callFake( () => getTemplateValuesResponse )
		};

		validators = {
			isMetadata: jasmine.createSpy( 'validators.isMetaData' ),
		};

		metadata = {
			statusTypes: { a: 1, b: 2 },
		};

		urls = {
			reports: {
				detail: jasmine.createSpy( 'urls.reports.detail' ),
				adminAreas: jasmine.createSpy( 'urls.reports.adminAreas' ),
				addAdminArea: jasmine.createSpy( 'urls.reports.addAdminArea' ),
				hasSectors: jasmine.createSpy( 'urls.reports.hasSectors' ),
			},
		};

		backend = {
			reports: {
				save: jasmine.createSpy( 'backend.reports.save' ),
				update: jasmine.createSpy( 'backend.reports.update' ),
			}
		};

		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );
		govukItemsFromObj = jasmine.createSpy( 'govukItemsFromObj' ).and.callFake( () => govukItemsFromObjResponse );

		controller = proxyquire( modulePath, {
			'../../../lib/backend-service': backend,
			'../../../lib/metadata': metadata,
			'../../../lib/Form': Form,
			'../../../lib/urls': urls,
			'../../../lib/validators': validators,
			'../../../lib/govuk-items-from-object': govukItemsFromObj
		} );
	} );

	describe( 'hasAdminAreas', () => {

		let report;

		beforeEach( () => {

			report = {
				id: uuid(),
				admin_areas: null,
			};
			req.report = report;
		} );

		describe( 'Form config', () => {

			let boolResponse;

			beforeEach( () => {

				boolResponse = { 'boolResponse': 'yes' };

				validators.isMetadata.and.callFake( ( key ) => {

					if( key === 'bool' ){ return boolResponse; }
				} );
			} );

			it( 'Should setup the form correctly', async () => {

				govukItemsFromObjResponse = [
					{
						value: '1',
						text: 'Affects entire country'
					},{
						value: '2',
						text: 'Affects individual states'
					}
				];

				await controller( req, res, next );

				const args = Form.calls.argsFor( 0 );
				const config = args[ 1 ];

				expect( Form ).toHaveBeenCalled();
				expect( args[ 0 ] ).toEqual( req );

				expect( config.hasAdminAreas ).toBeDefined();
				expect( config.hasAdminAreas.type ).toEqual( Form.RADIO );
				expect( config.hasAdminAreas.values ).toEqual( [ report.has_admin_areas ] );
				expect( config.hasAdminAreas.validators[ 0 ].fn ).toEqual( boolResponse );
				expect( config.hasAdminAreas.items ).toEqual( [
					{
						value: '1',
						text: 'Affects entire country'
					},{
						value: '2',
						text: 'Affects individual states'
					}
				] );
			} );
		} );

		describe( 'FormProcessor', () => {

			let FormProcessor;
			let processFn;
			let args;

			beforeEach( async () => {

				FormProcessor = jasmine.createSpy( 'FormProcessor' );
				processFn = jasmine.createSpy( 'FormProcessor.process' );

				controller = proxyquire( modulePath, {
					'../../../lib/backend-service': backend,
					'../../../lib/urls': urls,
					'../../../lib/metadata': metadata,
					'../../../lib/Form': Form,
					'../../../lib/FormProcessor': FormProcessor,
					'../../../lib/validators': validators,
					'../../../lib/govuk-items-from-object': govukItemsFromObj,
				} );

				FormProcessor.and.callFake( () => ({
					process: processFn
				}) );

				await controller( req, res, next );

				args = FormProcessor.calls.argsFor( 0 )[ 0 ];
			} );

			it( 'Should setup the FormProcessor correctly', () => {

				expect( args.form ).toEqual( form );
				expect( typeof args.render ).toEqual( 'function' );
				expect( typeof args.saveFormData ).toEqual( 'function' );
				expect( typeof args.saved ).toEqual( 'function' );
			} );

			describe( 'render', () => {
				it( 'Should render the template with the correct data', () => {

					const template = 'reports/views/has-sectors';

					args.render( getTemplateValuesResponse );

					expect( res.render ).toHaveBeenCalledWith( template, getTemplateValuesResponse );
				} );
			} );

			describe( 'safeFormData', () => {
				it( 'Should call the correct method with the correct data', () => {

					const myFormData = { a: true, b: false };

					args.saveFormData( myFormData );

					expect( backend.reports.saveHasSectors ).toHaveBeenCalledWith( req, report.id, myFormData );
				} );
			} );

			describe( 'Saved', () => {
				describe( 'When form.isExit is true', () => {
					it( 'Should redirect to the correct URL', () => {

						const detailResponse = '/a/path/detail';

						urls.reports.detail.and.callFake( () => detailResponse );
						form.isExit = true;

						args.saved();

						expect( urls.reports.detail ).toHaveBeenCalledWith( report.id  );
						expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
					} );
				} );

				describe( 'When hasSectors is true', () => {

					beforeEach( () => {

						getValuesResponse = { hasSectors: 'true' };
					} );

					describe( 'When there are sectors', () => {

						afterEach( () => {


							const sectorsResponse = '/sectors';

							urls.reports.sectors.and.callFake( () => sectorsResponse );

							args.saved();

							expect( urls.reports.sectors ).toHaveBeenCalledWith( report.id );
							expect( res.redirect ).toHaveBeenCalledWith( sectorsResponse );
						} );

						describe( 'When the sectors are in the report', () => {
							it( 'Should call the correct url', () => {

								report.sectors = [ uuid(), uuid() ];
							} );
						} );

						describe( 'When the sectors are in the session', () => {
							it( 'Should call the correct url', () => {

								req.session.sectors = [ uuid(), uuid() ];
							} );
						} );
					} );

					describe( 'When there are NOT any sectors', () => {
						it( 'Should redirect to the correct URL', () => {

							const addSectorResponse = '/add/sector';

							urls.reports.addSector.and.callFake( () => addSectorResponse );

							args.saved();

							expect( urls.reports.addSector ).toHaveBeenCalledWith( report.id );
							expect( res.redirect ).toHaveBeenCalledWith( addSectorResponse );
						} );
					} );
				} );

				describe( 'When hasSectors is false', () => {
					it( 'Should redirect to the correct URL', () => {

						const aboutProblemResponse = '/about/sector';

						urls.reports.aboutProblem.and.callFake( () => aboutProblemResponse );
						getValuesResponse = { hasSectors: 'false' };

						args.saved();

						expect( urls.reports.aboutProblem ).toHaveBeenCalledWith( report.id );
						expect( res.redirect ).toHaveBeenCalledWith( aboutProblemResponse );
					} );
				} );
			} );

			describe( 'Calling formProcessor.process', () => {
				describe( 'When there are no errors', () => {
					it( 'Should not call next', async () => {

						await controller( req, res, next );

						expect( next ).not.toHaveBeenCalledWith();
					} );
				} );

				describe( 'When the formProcessor throws an error', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'Some random error' );

						processFn.and.callFake( () => Promise.reject( err ) );

						await controller( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
					} );
				} );
			} );
		} );
	} );
} );
