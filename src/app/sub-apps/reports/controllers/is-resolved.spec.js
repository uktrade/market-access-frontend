const proxyquire = require( 'proxyquire' );
const metadata = require( '../../../lib/metadata' );

const { RESOLVED, PART_RESOLVED } = metadata.barrier.status.types;
const modulePath = './is-resolved';

describe( 'Report controllers', () => {

	let controller;
	let req;
	let res;
	let Form;
	let form;
	let urls;
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

		urls = {
			reports: {
				country: jasmine.createSpy( 'urls.reports.country' ),
			},
		};

		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );

		controller = proxyquire( modulePath, {
			'../../../lib/Form': Form,
			'../../../lib/urls': urls,
		} );
	} );

	describe( 'isResolved', () => {

		const template = 'reports/views/is-resolved';
		let templateData;

		beforeEach( () => {

			templateData = {
				...getTemplateValuesResponse,
				types: {
					RESOLVED,
					PART_RESOLVED,
				}
			};
		} );

		describe( 'When the status is fully resolved', () => {
			it( 'Should setup the form correctly', () => {

				const report = {
					is_resolved: true,
					resolved_status: RESOLVED,
					resolved_date: '2018-02-01'
				};

				req.report = report;

				controller( req, res );

				const args = Form.calls.argsFor( 0 );
				const config = args[ 1 ];

				expect( Form ).toHaveBeenCalled();
				expect( args[ 0 ] ).toEqual( req );

				expect( config.isResolved ).toBeDefined();
				expect( config.isResolved.type ).toEqual( Form.RADIO );
				expect( config.isResolved.values ).toEqual( [ report.resolved_status ] );
				expect( config.isResolved.validators.length ).toEqual( 1 );

				expect( config.resolvedDate ).toBeDefined();
				expect( config.resolvedDate.type ).toEqual( Form.GROUP );
				expect( config.resolvedDate.conditional ).toEqual( { name: 'isResolved', value: RESOLVED } );
				expect( config.resolvedDate.errorField ).toEqual( 'resolved_date' );
				expect( config.resolvedDate.validators.length ).toEqual( 5 );
				expect( config.resolvedDate.items ).toEqual( {
					month: {
						values: [ '02' ]
					},
					year: {
						values: [ '2018' ]
					}
				} );
			} );
		} );

		describe( 'When the status is partially resolved', () => {
			it( 'Should setup the form correctly', () => {

				const report = {
					is_resolved: true,
					resolved_status: PART_RESOLVED,
					resolved_date: '2018-02-01'
				};

				req.report = report;

				controller( req, res );

				const args = Form.calls.argsFor( 0 );
				const config = args[ 1 ];

				expect( Form ).toHaveBeenCalled();
				expect( args[ 0 ] ).toEqual( req );

				expect( config.isResolved ).toBeDefined();
				expect( config.isResolved.type ).toEqual( Form.RADIO );
				expect( config.isResolved.values ).toEqual( [ report.resolved_status ] );
				expect( config.isResolved.validators.length ).toEqual( 1 );

				expect( config.partResolvedDate ).toBeDefined();
				expect( config.partResolvedDate.type ).toEqual( Form.GROUP );
				expect( config.partResolvedDate.conditional ).toEqual( { name: 'isResolved', value: PART_RESOLVED } );
				expect( config.partResolvedDate.errorField ).toEqual( 'resolved_date' );
				expect( config.partResolvedDate.validators.length ).toEqual( 5 );
				expect( config.partResolvedDate.items ).toEqual( {
					partMonth: {
						values: [ '02' ]
					},
					partYear: {
						values: [ '2018' ]
					}
				} );
			} );
		} );

		describe( 'When the status is partially resolved', () => {
			it( 'Should setup the form correctly', () => {

				const report = {
					is_resolved: false,
					resolved_status: null,
					resolved_date: null
				};

				req.report = report;

				controller( req, res );

				const args = Form.calls.argsFor( 0 );
				const config = args[ 1 ];

				expect( Form ).toHaveBeenCalled();
				expect( args[ 0 ] ).toEqual( req );

				expect( config.isResolved ).toBeDefined();
				expect( config.isResolved.type ).toEqual( Form.RADIO );
				expect( config.isResolved.values ).toEqual( [ false ] );
				expect( config.isResolved.validators.length ).toEqual( 1 );
			} );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the template', () => {

				controller( req, res );

				expect( res.render ).toHaveBeenCalledWith( template, templateData );
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
					expect( res.render ).toHaveBeenCalledWith( template, templateData );
				} );
			} );
		} );
	} );
} );
