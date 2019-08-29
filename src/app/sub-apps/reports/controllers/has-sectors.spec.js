const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

const modulePath = './has-sectors';

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
				aboutProblem: jasmine.createSpy( 'urls.reports.aboutProblem' ),
				sectors: {
					list: jasmine.createSpy( 'urls.reports.sectors.list' ),
				},
			},
		};

		backend = {
			reports: {
				saveHasSectors: jasmine.createSpy( 'backend.reports.saveHasSectors' ),
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

	describe( 'hasSectors', () => {

		let report;

		beforeEach( () => {

			report = {
				id: uuid(),
				sectors: null,
				sectors_affected: true
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

				expect( config.hasSectors ).toBeDefined();
				expect( config.hasSectors.type ).toEqual( Form.RADIO );
				expect( config.hasSectors.values ).toEqual( [ report.sectors_affected ] );
				expect( config.hasSectors.validators[ 0 ].fn ).toEqual( boolResponse );
				expect( config.hasSectors.items ).toEqual( [
					{
						value: 'true',
						text: 'yes'
					},{
						value: 'false',
						text: 'No, I don\'t know at the moment'
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

					it( 'Should redirect to the correct URL', () => {

						const listResponse = '/list-sectors';

						urls.reports.sectors.list.and.callFake( () => listResponse );
						getValuesResponse = { hasSectors: 'true' };

						args.saved();

						expect( urls.reports.sectors.list ).toHaveBeenCalledWith( report.id );
						expect( res.redirect ).toHaveBeenCalledWith( listResponse );
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
