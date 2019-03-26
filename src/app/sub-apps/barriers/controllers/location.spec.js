const proxyquire = require( 'proxyquire' );

const modulePath = './location';
const SELECT = 'select-value';

describe( 'Edit barrier controller', () => {

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
				detail: jasmine.createSpy( 'urls.barriers.detail' )
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

	describe( 'country', () => {

		const template = 'barriers/views/edit/headlines';

		it( 'Should configure the Form correctly', async () => {

			const isMetadataResponse = { ab: '12', cd: '34' };

			validators.isMetadata.and.callFake( () => isMetadataResponse );

			await controller.country( req, res, next );

			const config = Form.calls.argsFor( 0 )[ 1 ];

			expect( config.country ).toBeDefined();
			expect( config.country.type ).toEqual( SELECT );
			expect( config.country.values ).toEqual( [ barrier.export_country ] );
			expect( config.country.items ).toEqual( metadata.getCountryList() );
			expect( config.country.validators.length ).toEqual( 1 );
			expect( config.country.validators[ 0 ].fn ).toEqual( validators.isCountry );

			expect( config.status ).not.toBeDefined();
		} );

		it( 'Should configure the FormProcessor correctly', async () => {

			await controller.country( req, res );

			const config = FormProcessor.calls.argsFor( 0 )[ 0 ];
			const templateValues = { abc: '123' };
			const formValues = { def: 456 };
			const detailResponse = '/barrier/location';

			expect( config.form ).toEqual( form );
			expect( typeof config.render ).toEqual( 'function' );
			expect( typeof config.saveFormData ).toEqual( 'function' );
			expect( typeof config.saved ).toEqual( 'function' );

			config.render( templateValues );

			expect( res.render ).toHaveBeenCalledWith( template, templateValues );

			config.saveFormData( formValues );

			expect( backend.barriers.saveCountry ).toHaveBeenCalledWith( req, barrier.id, formValues );

			urls.barriers.detail.and.callFake( () => detailResponse );

			config.saved();

			expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
			expect( urls.barriers.location.list ).toHaveBeenCalledWith( barrier.id );
		} );

		describe( 'When the processor does not throw an error', () => {
			it( 'Should not call next', async () => {

				await controller.country( req, res, next );

				expect( next ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'When the processor throws an errror', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'a random error' );

				processor.process.and.callFake( () => { throw err; } );

				await controller.country( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
			} );
		} );
	} );
} );
