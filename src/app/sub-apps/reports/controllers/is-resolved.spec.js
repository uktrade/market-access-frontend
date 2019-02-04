const proxyquire = require( 'proxyquire' );

const modulePath = './is-resolved';

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
	let govukItemsFromObjResponse;
	let getValuesResponse;
	let getTemplateValuesResponse;

	beforeEach( () => {

		( { req, res } = jasmine.helpers.mocks.middleware() );

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
			isDateValue: jasmine.createSpy( 'validators.isDateValue' ),
		};

		metadata = {
			statusTypes: { a: 1, b: 2 },
		};

		urls = {
			reports: {
				country: jasmine.createSpy( 'urls.reports.country' ),
			},
		};

		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );
		govukItemsFromObj = jasmine.createSpy( 'govukItemsFromObj' ).and.callFake( () => govukItemsFromObjResponse );

		controller = proxyquire( modulePath, {
			'../../../lib/metadata': metadata,
			'../../../lib/Form': Form,
			'../../../lib/urls': urls,
			'../../../lib/validators': validators,
			'../../../lib/govuk-items-from-object': govukItemsFromObj
		} );
	} );

	describe( 'isResolved', () => {
		const template = 'reports/views/is-resolved';

		it( 'Should setup the form correctly', () => {

			const monthResponse = { month: true };
			const yearResponse = { year: true };
			const boolResponse = { bool: true };
			const sessionValues = {
				isResolved: 'isResolved'
			};
			const report = {
				is_resolved: 'is_resolved',
				resolved_date: '2018-02-01'
			};

			req.report = report;
			req.session.isResolvedFormValues = sessionValues;

			validators.isMetadata.and.callFake( ( key ) => {

				if( key === 'bool' ){ return boolResponse; }
			} );

			validators.isDateValue.and.callFake( ( key ) => {

				if( key === 'month' ){ return monthResponse; }
				if( key === 'year' ){ return yearResponse; }
			} );

			controller( req, res );

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];

			expect( Form ).toHaveBeenCalled();
			expect( args[ 0 ] ).toEqual( req );

			expect( config.isResolved ).toBeDefined();
			expect( config.isResolved.type ).toEqual( Form.RADIO );
			expect( config.isResolved.values ).toEqual( [ sessionValues.isResolved, report.is_resolved ] );
			expect( config.isResolved.items ).toEqual( govukItemsFromObjResponse );
			expect( govukItemsFromObj ).toHaveBeenCalledWith( metadata.bool );
			expect( config.isResolved.validators.length ).toEqual( 1 );
			expect( config.isResolved.validators[ 0 ].fn ).toEqual( boolResponse );

			expect( config.resolvedDate ).toBeDefined();
			expect( config.resolvedDate.type ).toEqual( Form.GROUP );
			expect( config.resolvedDate.conditional ).toEqual( { name: 'isResolved', value: 'true' } );
			expect( config.resolvedDate.errorField ).toEqual( 'resolved_date' );
			expect( config.resolvedDate.validators.length ).toEqual( 5 );
			expect( config.resolvedDate.validators[ 0 ].fn ).toEqual( monthResponse );
			expect( config.resolvedDate.validators[ 1 ].fn ).toEqual( yearResponse );
			expect( config.resolvedDate.validators[ 2 ].fn ).toEqual( validators.isDateNumeric );
			expect( config.resolvedDate.validators[ 3 ].fn ).toEqual( validators.isDateValid );
			expect( config.resolvedDate.validators[ 4 ].fn ).toEqual( validators.isDateInPast );
			expect( config.resolvedDate.items ).toEqual( {
				month: {
					values: [ '02' ]
				},
				year: {
					values: [ '2018' ]
				}
			} );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the template', () => {

				controller( req, res );

				expect( res.render ).toHaveBeenCalledWith( template, getTemplateValuesResponse );
				expect( form.hasErrors ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'When it is a POST', () => {

			beforeEach( () => {

				form.isPost = true;
			} );

			describe( 'When the form is valid', () => {
				it( 'Should save the values to the session and redirect to the correct url', () => {

					const countryUrlResponse = '/a/country/url';

					urls.reports.country.and.callFake( () => countryUrlResponse );

					controller( req, res );

					expect( form.validate ).toHaveBeenCalledWith();
					expect( form.hasErrors ).toHaveBeenCalledWith();
					expect( req.session.isResolvedFormValues ).toEqual( getValuesResponse );
					expect( res.redirect ).toHaveBeenCalledWith( countryUrlResponse );
					expect( res.render ).not.toHaveBeenCalled();
				} );
			} );

			describe( 'When the form is not valid', () => {
				it( 'Should save the values to the session and redirect to the correct url', () => {

					form.hasErrors.and.callFake( () => true );

					controller( req, res );

					expect( form.validate ).toHaveBeenCalledWith();
					expect( form.hasErrors ).toHaveBeenCalledWith();
					expect( typeof req.session.isResolvedFormValues ).toEqual( 'undefined' );
					expect( res.redirect ).not.toHaveBeenCalled();
					expect( res.render ).toHaveBeenCalledWith( template, getTemplateValuesResponse );
				} );
			} );
		} );
	} );
} );
