const proxyquire = require( 'proxyquire' );

const modulePath = './start';

describe( 'Report controllers', () => {

	let controller;
	let req;
	let res;
	let Form;
	let form;
	let urls;
	let metadata;
	let validators;
	let govukItemsFromObj;
	let getValuesResponse;
	let getTemplateValuesResponse;

	beforeEach( () => {

		( { req, res } = jasmine.helpers.mocks.middleware() );

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
				isResolved: jasmine.createSpy( 'urls.reports.isResolved' ),
			},
		};

		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );
		govukItemsFromObj = jasmine.createSpy( 'govukItemsFromObj' );

		controller = proxyquire( modulePath, {
			'../../../lib/metadata': metadata,
			'../../../lib/Form': Form,
			'../../../lib/urls': urls,
			'../../../lib/validators': validators,
			'../../../lib/govuk-items-from-object': govukItemsFromObj
		} );
	} );

	describe( 'Start', () => {
		it( 'Should setup the form correctly', () => {

			const statusTypesResponse = { status: 1 };
			const boolResponse = { bool: 1 };
			const report = {
				problem_status: 'report status'
			};
			const sessionValues = {
				status: 'session status',
				emergency: 'session emergency'
			};
			const govukItemsFromObjResponse = [ { test: 2 } ];

			req.session.startFormValues = sessionValues;
			req.report = report;

			validators.isMetadata.and.callFake( ( key ) => {

				if( key === 'statusTypes' ){ return statusTypesResponse; }
				if( key === 'bool' ){ return boolResponse; }
			} );

			govukItemsFromObj.and.callFake( () => govukItemsFromObjResponse );
			Form.RADIO = 'radio';

			controller( req, res );

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];

			expect( Form ).toHaveBeenCalled();
			expect( args[ 0 ] ).toEqual( req );

			expect( config.status ).toBeDefined();
			expect( config.status.type ).toEqual( 'radio' );
			expect( config.status.values ).toEqual( [ sessionValues.status, report.problem_status ] );
			expect( config.status.validators[ 0 ].fn ).toEqual( statusTypesResponse );
			expect( config.status.items ).toEqual( govukItemsFromObjResponse );
			expect( govukItemsFromObj ).toHaveBeenCalledWith( metadata.statusTypes );

			expect( config.emergency ).not.toBeDefined();
		} );

		describe( 'When it is a POST', () => {

			beforeEach( () => {

				req.method = 'POST';
				req.body = {};
				form.isPost = true;
			} );

			describe( 'When the input values are valid', () => {

				it( 'Should save the values and redirect to the next step', () => {

					const isResolvedUrl = 'my-url';
					const status = '123';

					req.body = { status };
					form.hasErrors = () => false;

					urls.reports.isResolved.and.callFake( () => isResolvedUrl );

					controller( req, res );

					expect( form.validate ).toHaveBeenCalled();
					expect( req.session.startFormValues ).toEqual( getValuesResponse );
					expect( urls.reports.isResolved ).toHaveBeenCalledWith( undefined );
					expect( res.redirect ).toHaveBeenCalledWith( isResolvedUrl );
				} );
			} );

			describe( 'When no input values are given', () => {

				beforeEach( () => {

					req.session.startFormValues = { test: 1 };
					form.hasErrors = () => true;
				} );

				it( 'Should not save the values to the session', () => {

					controller( req, res );
					expect( req.session.startFormValues ).not.toBeDefined();
				} );
			} );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the start page with the form values', () => {

				const sessionValues = { status: 1 };

				req.session.startFormValues = sessionValues;
				req.report = { id: 1, test: 2 };

				controller( req, res );

				expect( form.getTemplateValues ).toHaveBeenCalledWith();
				expect( res.render ).toHaveBeenCalledWith( 'reports/views/start', getTemplateValuesResponse );
			} );
		} );
	} );
} );
