const proxyquire = require( 'proxyquire' );

const modulePath = './location';
const SELECT = 'select-value';

describe( 'Edit barrier location controller', () => {

	let controller;
	let req;
	let res;
	let next;
	let barrier;
	let metadata;
	let validators;
	let Form;
	let form;
	let FormProcessor;
	let processor;
	let backend;
	let urls;

	beforeEach( () => {

		metadata = {
			getCountryList: () =>  [ 'country one', 'country two' ],
		};

		form = { c: 3, d: 4 };

		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );
		Form.SELECT = SELECT;

		processor = {
			process: jasmine.createSpy( 'FormProcessor.process' )
		};
		FormProcessor = jasmine.createSpy( 'FormProcessor' ).and.callFake( () => processor );


		validators = {
			isCountry: jasmine.createSpy( 'validators.isCountry' ),
			isMetadata: jasmine.createSpy( 'validators.isMetadata' ),
		};

		backend = {
			barriers: {
				saveTitle: jasmine.createSpy( 'backend.barriers.saveCountry' ),
			}
		};

		urls = {
			barriers: {
				detail: jasmine.createSpy( 'urls.barriers.detail' ),
				location: {
					list: jasmine.createSpy( 'urls.barriers.location.list' )
				}
			}
		};

		barrier = jasmine.helpers.getFakeData( '/backend/barriers/barrier' );

		req = {
			barrier,
			session: {},
			params: {},
			query: {}
		};
		

		res = {
			render: jasmine.createSpy( 'res.render' ),
			redirect: jasmine.createSpy( 'res.redirect' )
		};

		getValuesResponse = { country: 'country 2' };
		getTemplateValuesResponse = { country: 'country 1' };
		form = {
			validate: jasmine.createSpy( 'form.validate' ),
			getValues: jasmine.createSpy( 'form.getValues' ).and.callFake( () => getValuesResponse ),
			getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.callFake( () => Object.assign( {}, getTemplateValuesResponse ) )
		};

		next = jasmine.createSpy( 'next' );

		controller = proxyquire( modulePath, {
			'../../../lib/metadata': metadata,
			'../../../lib/validators': validators,
			'../../../lib/Form': Form,
			'../../../lib/FormProcessor': FormProcessor,
			'../../../lib/backend-service': backend,
			'../../../lib/urls': urls,
		} );
	} );

	fdescribe( 'country', () => {

		beforeEach( () => {
			req.session = {
				location: { country: 'country 1' }
			}
		});

		it( 'Should configure the Form correctly', async () => {

			const isMetadataResponse = { ab: '12', cd: '34' };

			validators.isMetadata.and.callFake( () => isMetadataResponse );

			await controller.country( req, res, next );

			const config = Form.calls.argsFor( 0 )[ 1 ];

			expect( config.country ).toBeDefined();
			expect( config.country.type ).toEqual( SELECT );
			expect( config.country.values ).toEqual( [ 'country 1' ] );
			expect( config.country.items ).toEqual( metadata.getCountryList() );
			expect( config.country.validators.length ).toEqual( 1 );
			expect( config.country.validators[ 0 ].fn ).toEqual( validators.isCountry );

			expect( config.status ).not.toBeDefined();
		} );

		describe('When it is a GET', () => {
			it( 'Should render the template', () => {
				controller.country( req, res );

				expect( res.render ).toHaveBeenCalledWith( 'barriers/views/location/country', Object.assign( {},
					getTemplateValuesResponse,
				) );
			} );
		});

		describe('When it is a POST', () => {

			beforeEach( () => {
				form.isPost = true;
			});

			describe('When the form has errors', () => {
				it( 'Should render the template', () => {

					form.hasErrors = () => true;

					controller.country( req, res );

					expect( res.render ).toHaveBeenCalledWith( 'barriers/views/location/country', Object.assign( {},
						getTemplateValuesResponse,
					) );
				} );
			})

			describe('When the form does not have errors', () => {
				it('Should add the country to the session', () => {
				
					form.hasErrors = () => false;

					const listResponse = '/list/location';
					urls.barriers.location.list.and.callFake( () => listResponse );

					controller.country( req, res );

					expect(req.session.location.country).toEqual('country 2');
					expect( res.redirect).toHaveBeenCalledWith(listResponse);
				})
			})
		});
	} );
} );
