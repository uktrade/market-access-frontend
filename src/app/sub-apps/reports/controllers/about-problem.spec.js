const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

const modulePath = './about-problem';

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
			barrierSource: {
				'A': 'a',
				'B': 'b'
			},
		};

		urls = {
			reports: {
				detail: jasmine.createSpy( 'urls.reports.detail' ),
				sectors: jasmine.createSpy( 'urls.reports.sectors' ),
				hasSectors: jasmine.createSpy( 'urls.reports.hasSectors' ),
				summary: jasmine.createSpy( 'urls.reports.summary' ),
			},
			barriers: {
				detail: jasmine.createSpy( 'urls.barriers.detail' ),
			},
		};

		backend = {
			reports: {
				saveProblem: jasmine.createSpy( 'backend.reports.saveProblem' ),
				saveProblemAndSubmit: jasmine.createSpy( 'backend.reports.saveProblemAndSubmit' ),
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

	describe( 'aboutProblem', () => {

		let report;

		beforeEach( () => {

			report = {
				id: uuid(),
				product: 'myProduct',
				problem_description: 'a description',
				barrier_title: 'barrier_title',
				eu_exit_related: true,
				source: 'barrier_awareness',
				other_source: 'barrier_awareness_other',
				resolution_summary: 'resolution_summary'
			};
			req.report = report;
		} );

		describe( 'Form config', () => {

			let barrierSourceResponse;
			let boolResponse;
			let optionalBoolResponse;

			function checkForm( args ){

				const config = args[ 1 ];

				expect( Form ).toHaveBeenCalled();
				expect( args[ 0 ] ).toEqual( req );

				expect( config.item ).toBeDefined();
				expect( config.item.required ).toBeDefined();
				expect( config.item.values ).toEqual( [ report.product ] );

				expect( config.barrierTitle ).toBeDefined();
				expect( config.barrierTitle.values ).toEqual( [ report.barrier_title ] );
				expect( config.barrierTitle.required ).toBeDefined();

				expect( config.barrierSource ).toBeDefined();
				expect( config.barrierSource.type ).toEqual( Form.RADIO );
				expect( config.barrierSource.values ).toEqual( [ report.source ] );
				expect( config.barrierSource.validators[ 0 ].fn ).toEqual( barrierSourceResponse );
				expect( config.barrierSource.items ).toEqual( govukItemsFromObjResponse );

				expect( config.barrierSourceOther ).toBeDefined();
				expect( config.barrierSourceOther.conditional ).toEqual( { name: 'barrierSource', value: 'OTHER' } );
				expect( config.barrierSourceOther.values ).toEqual( [ report.other_source ] );

				expect( config.euExitRelated ).toBeDefined();
				expect( config.euExitRelated.type ).toEqual( Form.RADIO );
				expect( config.euExitRelated.values ).toEqual( [ report.eu_exit_related ] );
				expect( config.euExitRelated.validators.length ).toEqual( 1 );
				expect( config.euExitRelated.validators[ 0 ].fn ).toEqual( optionalBoolResponse );
				expect( config.euExitRelated.items ).toEqual( govukItemsFromObjResponse );

				expect( config.country ).not.toBeDefined();
				expect( config.description ).not.toBeDefined();
				expect( config.resolvedDescription ).not.toBeDefined();
			}

			beforeEach( () => {

				barrierSourceResponse = { barrierSourceResponse: true };
				boolResponse = { boolResponse: 1 };
				optionalBoolResponse = { optionalBoolResponse: 2 };

				validators.isMetadata.and.callFake( ( key ) => {

					if( key === 'barrierSource' ){ return barrierSourceResponse; }
					if( key === 'bool' ){ return boolResponse; }
					if( key === 'optionalBool' ){ return optionalBoolResponse; }
				} );
			} );

			it( 'Should setup the form correctly', async () => {

				await controller( req, res, next );

				checkForm( Form.calls.argsFor( 0 ) );
			} );
		} );

		describe( 'FormProcessor', () => {

			const template = 'reports/views/about-problem';

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
				describe( 'When the report has sectors_affected', () => {
					it( 'Should render the template with the correct data', () => {

						const myValues = { some: 'data' };
						const sectorsResponse = 'sectors';
						const renderValues = Object.assign( {}, myValues, { backHref: sectorsResponse } );

						urls.reports.sectors.and.callFake( () => sectorsResponse );
						report.sectors_affected = true;

						args.render( myValues );

						expect( res.render ).toHaveBeenCalledWith( template, renderValues );
					} );
				} );

				describe( 'When the report does not have sectors_affected', () => {
					it( 'Should render the template with the correct data', () => {

						const myValues = { some: 'data' };
						const hasSectorsResponse = 'hasSectors';
						const renderValues = Object.assign( {}, myValues, { backHref: hasSectorsResponse  } );

						urls.reports.hasSectors.and.callFake( () => hasSectorsResponse );

						args.render( myValues );

						expect( res.render ).toHaveBeenCalledWith( template, renderValues );
					} );
				} );
			} );

			describe( 'saveFormData', () => {
				describe( 'When it is Save and exit', () => {
					it( 'Should call the correct method with the correct data', () => {

						const myFormData = { a: true, b: false };

						form.isExit = true;

						args.saveFormData( myFormData );

						expect( backend.reports.saveProblem ).toHaveBeenCalledWith( req, report.id, myFormData );
					} );
				} );

				describe( 'When it is Save and continue', () => {
					it( 'Should call the correct method with the correct data', () => {

						const myFormData = { a: true, b: false };

						args.saveFormData( myFormData );

						expect( backend.reports.saveProblem ).toHaveBeenCalledWith( req, report.id, myFormData );
					} );
				} );
			} );

			describe( 'Saved', () => {
				describe( 'When it is Save and exit', () => {
					it( 'Should redirect to the report detail page', () => {

						const detailUrlResponse = '/detail-url';
						const body = { id: 123 };

						form.isExit = true;
						urls.reports.detail.and.callFake( () => detailUrlResponse );

						args.saved( body );

						expect( urls.reports.detail ).toHaveBeenCalledWith( body.id );
						expect( res.redirect ).toHaveBeenCalledWith( detailUrlResponse );
						expect( req.flash ).not.toHaveBeenCalled();
						expect( next ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'When it is Save and continue', () => {
					it( 'Should redirect to the barrier detail page', () => {

						const summaryUrlResponse = '/detail-url';
						const body = { id: 123 };

						urls.reports.summary.and.callFake( () => summaryUrlResponse );

						args.saved( body );

						expect( req.flash ).not.toHaveBeenCalled();
						expect( urls.reports.summary ).toHaveBeenCalledWith( body.id );
						expect( res.redirect ).toHaveBeenCalledWith( summaryUrlResponse );
						expect( next ).not.toHaveBeenCalled();
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
