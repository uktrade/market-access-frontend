const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

const modulePath = './all-sectors';

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
                addSector:  jasmine.createSpy( 'urls.reports.addSector' ),
                sectors:  jasmine.createSpy( 'urls.reports.sectors' ),
				aboutProblem: jasmine.createSpy( 'urls.reports.aboutProblem' ),
			},
		};

		backend = {
			reports: {
				saveAllSectors: jasmine.createSpy( 'backend.reports.saveAllSectors' ),
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

	describe( 'allSectors', () => {

		let report;

		beforeEach( () => {

			report = {
				id: uuid(),
				sectors: null,
				all_sectors: true
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
						value: 'true',
						text: 'yes'
					},{
						value: 'false',
						text: 'No'
					}
				];

				await controller( req, res, next );

				const args = Form.calls.argsFor( 0 );
				const config = args[ 1 ];

				expect( Form ).toHaveBeenCalled();
				expect( args[ 0 ] ).toEqual( req );

				expect( config.allSectors ).toBeDefined();
				expect( config.allSectors.type ).toEqual( Form.RADIO );
				expect( config.allSectors.values ).toEqual( [ report.all_sectors ] );
				expect( config.allSectors.validators[ 0 ].fn ).toEqual( boolResponse );
				expect( config.allSectors.items ).toEqual( [
					{
						value: 'true',
						text: 'All sectors'
					},{
						value: 'false',
						text: 'Just some sectors'
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

					const template = 'reports/views/all-sectors';

					args.render( getTemplateValuesResponse );

					expect( res.render ).toHaveBeenCalledWith( template, getTemplateValuesResponse );
				} );
			} );

			describe( 'saveFormData', () => {
				it( 'Should call the correct method with the correct data', () => {

					const myFormData = { allSectors: true };

					args.saveFormData( myFormData );

					expect( backend.reports.saveAllSectors ).toHaveBeenCalledWith( req, report.id, myFormData );
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

				describe( 'When allSectors is false', () => {

					beforeEach( () => {
						getValuesResponse = { allSectors: 'false' };
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

				describe( 'When allSectors is true', () => {
					it( 'Should redirect to the correct URL', () => {

						const aboutProblemResponse = '/about/sector';

						urls.reports.aboutProblem.and.callFake( () => aboutProblemResponse );
						getValuesResponse = { allSectors: 'true' };

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
