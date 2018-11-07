const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

const modulePath = './edit';
const SELECT = 'select-value';
const RADIO = 'radio-value';

describe( 'Edit barrier controller', () => {

	let controller;
	let req;
	let res;
	let next;
	let barrierId;
	let metadata;
	let validators;
	let govukItemsFromObj;
	let govukItemsFromObjResponse;
	let Form;
	let form;
	let FormProcessor;
	let processor;
	let backend;
	let urls;

	beforeEach( () => {

		barrierId = uuid();

		metadata = {
			statusTypes: {
				'1': 'minima aspernatur optio',
				'2': 'veritatis alias maxime'
			},
			getCountryList: () =>  [ 'country one', 'country two' ]
		};

		govukItemsFromObjResponse = { a: 1, b: 2 };
		form = { c: 3, d: 4 };

		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );
		Form.SELECT = SELECT;
		Form.RADIO = RADIO;

		processor = {
			process: jasmine.createSpy( 'FormProcessor.process' )
		};
		FormProcessor = jasmine.createSpy( 'FormProcessor' ).and.callFake( () => processor );

		govukItemsFromObj = jasmine.createSpy( 'govukItemsFromObj' ).and.callFake( () => govukItemsFromObjResponse );

		validators = {
			isCountry: jasmine.createSpy( 'validators.isCountry' ),
			isMetadata: jasmine.createSpy( 'validators.isMetadata' )
		};

		backend = {
			barriers: {
				saveDetails: jasmine.createSpy( 'backend.barriers.saveDetails' ),
				saveProduct: jasmine.createSpy( 'backend.barriers.saveProduct' ),
				saveDescription: jasmine.createSpy( 'backend.barriers.saveDescription' ),
			}
		};

		urls = {
			barriers: {
				detail: jasmine.createSpy( 'urls.barriers.detail' )
			}
		};

		req = {
			barrier: {
				id: barrierId
			},
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
			'../../../lib/govuk-items-from-object': govukItemsFromObj,
			'../../../lib/Form': Form,
			'../../../lib/FormProcessor': FormProcessor,
			'../../../lib/backend-service': backend,
			'../../../lib/urls': urls,
		} );
	} );

	describe( 'headlines', () => {

		const template = 'barriers/views/edit/headlines';
		let barrier;

		beforeEach( () => {

			barrier = jasmine.helpers.getFakeData( '/backend/barriers/barrier' );

			req.barrier = barrier;
		} );

		it( 'Should configure the Form correctly', async () => {

			const isMetadataResponse = { ab: '12', cd: '34' };

			validators.isMetadata.and.callFake( () => isMetadataResponse );

			await controller.headlines( req, res, next );

			const config = Form.calls.argsFor( 0 )[ 1 ];

			expect( config.title ).toBeDefined();
			expect( config.title.values ).toEqual( [ barrier.barrier_title ] );
			expect( config.title.required ).toBeDefined();

			expect( config.country ).toBeDefined();
			expect( config.country.type ).toEqual( SELECT );
			expect( config.country.values ).toEqual( [ barrier.export_country ] );
			expect( config.country.items ).toEqual( metadata.getCountryList() );
			expect( config.country.validators.length ).toEqual( 1 );
			expect( config.country.validators[ 0 ].fn ).toEqual( validators.isCountry );

			expect( config.status ).toBeDefined();
			expect( config.status.type ).toEqual( RADIO );
			expect( config.status.values ).toEqual( [ barrier.problem_status ] );
			expect( config.status.items ).toEqual( govukItemsFromObjResponse );
			expect( govukItemsFromObj ).toHaveBeenCalledWith( metadata.statusTypes );
			expect( config.status.validators.length ).toEqual( 1 );
			expect( config.status.validators[ 0 ].fn ).toEqual( isMetadataResponse );
			expect( validators.isMetadata ).toHaveBeenCalledWith( 'statusTypes' );
		} );

		it( 'Should configure the FormProcessor correctly', async () => {

			await controller.headlines( req, res );

			const config = FormProcessor.calls.argsFor( 0 )[ 0 ];
			const templateValues = { abc: '123' };
			const formValues = { def: 456 };
			const detailResponse = '/barrier/details';

			expect( config.form ).toEqual( form );
			expect( typeof config.render ).toEqual( 'function' );
			expect( typeof config.saveFormData ).toEqual( 'function' );
			expect( typeof config.saved ).toEqual( 'function' );

			config.render( templateValues );

			expect( res.render ).toHaveBeenCalledWith( template, templateValues );

			config.saveFormData( formValues );

			expect( backend.barriers.saveDetails ).toHaveBeenCalledWith( req, barrier.id, formValues );

			urls.barriers.detail.and.callFake( () => detailResponse );

			config.saved();

			expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
			expect( urls.barriers.detail ).toHaveBeenCalledWith( barrier.id );
		} );

		describe( 'When the processor does not throw an error', () => {
			it( 'Should not call next', async () => {

				await controller.headlines( req, res, next );

				expect( next ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'When the processor throws an errror', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'a random error' );

				processor.process.and.callFake( () => { throw err; } );

				await controller.headlines( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
			} );
		} );
	} );

	describe( 'product', () => {

		const template = 'barriers/views/edit/product';
		let barrier;

		beforeEach( () => {

			barrier = jasmine.helpers.getFakeData( '/backend/barriers/barrier' );

			req.barrier = barrier;
		} );

		it( 'Should configure the Form correctly', async () => {

			await controller.product( req, res, next );

			const config = Form.calls.argsFor( 0 )[ 1 ];

			expect( config.product ).toBeDefined();
			expect( config.product.values ).toEqual( [ barrier.product ] );
			expect( config.product.required ).toBeDefined();
		} );

		it( 'Should configure the FormProcessor correctly', async () => {

			await controller.product( req, res );

			const config = FormProcessor.calls.argsFor( 0 )[ 0 ];
			const templateValues = { abc: '123' };
			const formValues = { def: 456 };
			const detailResponse = '/barrier/details';

			expect( config.form ).toEqual( form );
			expect( typeof config.render ).toEqual( 'function' );
			expect( typeof config.saveFormData ).toEqual( 'function' );
			expect( typeof config.saved ).toEqual( 'function' );

			config.render( templateValues );

			expect( res.render ).toHaveBeenCalledWith( template, templateValues );

			config.saveFormData( formValues );

			expect( backend.barriers.saveProduct ).toHaveBeenCalledWith( req, barrier.id, formValues );

			urls.barriers.detail.and.callFake( () => detailResponse );

			config.saved();

			expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
			expect( urls.barriers.detail ).toHaveBeenCalledWith( barrier.id );
		} );

		describe( 'When the processor does not throw an error', () => {
			it( 'Should not call next', async () => {

				await controller.product( req, res, next );

				expect( next ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'When the processor throws an errror', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'a random error' );

				processor.process.and.callFake( () => { throw err; } );

				await controller.product( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
			} );
		} );
	} );

	describe( 'description', () => {

		const template = 'barriers/views/edit/description';
		let barrier;

		beforeEach( () => {

			barrier = jasmine.helpers.getFakeData( '/backend/barriers/barrier' );

			req.barrier = barrier;
		} );

		it( 'Should configure the Form correctly', async () => {

			await controller.description( req, res, next );

			const config = Form.calls.argsFor( 0 )[ 1 ];

			expect( config.description ).toBeDefined();
			expect( config.description.values ).toEqual( [ barrier.problem_description ] );
			expect( config.description.required ).toBeDefined();
		} );

		it( 'Should configure the FormProcessor correctly', async () => {

			await controller.description( req, res );

			const config = FormProcessor.calls.argsFor( 0 )[ 0 ];
			const templateValues = { abc: '123' };
			const formValues = { def: 456 };
			const detailResponse = '/barrier/details';

			expect( config.form ).toEqual( form );
			expect( typeof config.render ).toEqual( 'function' );
			expect( typeof config.saveFormData ).toEqual( 'function' );
			expect( typeof config.saved ).toEqual( 'function' );

			config.render( templateValues );

			expect( res.render ).toHaveBeenCalledWith( template, templateValues );

			config.saveFormData( formValues );

			expect( backend.barriers.saveDescription ).toHaveBeenCalledWith( req, barrier.id, formValues );

			urls.barriers.detail.and.callFake( () => detailResponse );

			config.saved();

			expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
			expect( urls.barriers.detail ).toHaveBeenCalledWith( barrier.id );
		} );

		describe( 'When the processor does not throw an error', () => {
			it( 'Should not call next', async () => {

				await controller.description( req, res, next );

				expect( next ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'When the processor throws an errror', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'a random error' );

				processor.process.and.callFake( () => { throw err; } );

				await controller.description( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
			} );
		} );
	} );
} );
