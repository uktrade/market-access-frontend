const proxyquire = require( 'proxyquire' );
const { RESOLVED, PART_RESOLVED, PAUSED } = require( '../../../lib/metadata' ).barrier.status.types;

const modulePath = './edit';
const SELECT = 'select-value';
const RADIO = 'radio-value';

describe( 'Edit barrier controller', () => {

	let controller;
	let req;
	let res;
	let next;
	let barrier;
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
	let barrierFields;

	beforeEach( () => {

		( { req, res, next } = jasmine.helpers.mocks.middleware() );

		metadata = {
			statusTypes: {
				'1': 'minima aspernatur optio',
				'2': 'veritatis alias maxime'
			},
			getCountryList: () =>  [ 'country one', 'country two' ],
			getBarrierPrioritiesList: jasmine.createSpy( 'metadata.getBarrierPrioritiesList' ),
			bool: { a: 1, b: 2 },
			optionalBool: { c: 3, d: 4 },
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
			isMetadata: jasmine.createSpy( 'validators.isMetadata' ),
			isBarrierPriority: jasmine.createSpy( 'validators.isBarrierPriority' ),
		};

		backend = {
			barriers: {
				saveTitle: jasmine.createSpy( 'backend.barriers.saveTitle' ),
				saveProduct: jasmine.createSpy( 'backend.barriers.saveProduct' ),
				saveDescription: jasmine.createSpy( 'backend.barriers.saveDescription' ),
				saveSource: jasmine.createSpy( 'backend.barriers.saveSource' ),
				savePriority: jasmine.createSpy( 'backend.barriers.savePriority' ),
				saveEuExitRelated: jasmine.createSpy( 'backend.barriers.saveEuExitRelated' ),
				saveProblemStatus: jasmine.createSpy( 'backend.barriers.saveProblemStatus' ),
				saveStatus: jasmine.createSpy( 'backend.barriers.saveStatus' ),
			}
		};

		urls = {
			barriers: {
				detail: jasmine.createSpy( 'urls.barriers.detail' )
			}
		};

		barrier = jasmine.helpers.getFakeData( '/backend/barriers/barrier' );
		req.barrier = barrier;

		barrierFields = {
			createStatusDate: jasmine.createSpy( 'barrierFields.createStatusDate' ),
		};

		controller = proxyquire( modulePath, {
			'../../../lib/metadata': metadata,
			'../../../lib/validators': validators,
			'../../../lib/govuk-items-from-object': govukItemsFromObj,
			'../../../lib/Form': Form,
			'../../../lib/FormProcessor': FormProcessor,
			'../../../lib/backend-service': backend,
			'../../../lib/urls': urls,
			'../../../lib/barrier-fields': barrierFields,
		} );
	} );

	describe( 'title', () => {

		const template = 'barriers/views/edit/title';

		it( 'Should configure the Form correctly', async () => {

			await controller.title( req, res, next );

			const config = Form.calls.argsFor( 0 )[ 1 ];

			expect( config.title ).toBeDefined();
			expect( config.title.values ).toEqual( [ barrier.barrier_title ] );
			expect( config.title.required ).toBeDefined();

			expect( config.status ).not.toBeDefined();
		} );

		it( 'Should configure the FormProcessor correctly', async () => {

			await controller.title( req, res );

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

			expect( backend.barriers.saveTitle ).toHaveBeenCalledWith( req, barrier.id, formValues );

			urls.barriers.detail.and.callFake( () => detailResponse );

			config.saved();

			expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
			expect( urls.barriers.detail ).toHaveBeenCalledWith( barrier.id );
		} );

		describe( 'When the processor does not throw an error', () => {
			it( 'Should not call next', async () => {

				await controller.title( req, res, next );

				expect( next ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'When the processor throws an errror', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'a random error' );

				processor.process.and.callFake( () => { throw err; } );

				await controller.title( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
			} );
		} );
	} );

	describe( 'product', () => {

		const template = 'barriers/views/edit/product';

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

	describe( 'source', () => {

		const template = 'barriers/views/edit/source';

		it( 'Should configure the Form correctly', async () => {

			const isMetadataResponse = { ab: '12', cd: '34' };

			validators.isMetadata.and.callFake( () => isMetadataResponse );

			await controller.source( req, res, next );

			const config = Form.calls.argsFor( 0 )[ 1 ];

			expect( config.source ).toBeDefined();
			expect( config.source.values ).toEqual( [ barrier.source ] );
			expect( config.source.items ).toEqual( govukItemsFromObjResponse );
			expect( config.source.validators.length ).toEqual( 1 );
			expect( config.source.validators[ 0 ].fn ).toEqual( isMetadataResponse );

			expect( govukItemsFromObj ).toHaveBeenCalledWith( metadata.barrierSource );
			expect( validators.isMetadata ).toHaveBeenCalledWith( 'barrierSource' );

			expect( config.sourceOther ).toBeDefined();
			expect( config.sourceOther.values ).toEqual( [ barrier.other_source ] );
			expect( config.sourceOther.conditional ).toEqual( { name: 'source', value: 'OTHER' } );
			expect( config.sourceOther.required ).toBeDefined();
		} );

		it( 'Should configure the FormProcessor correctly', async () => {

			await controller.source( req, res );

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

			expect( backend.barriers.saveSource ).toHaveBeenCalledWith( req, barrier.id, formValues );

			urls.barriers.detail.and.callFake( () => detailResponse );

			config.saved();

			expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
			expect( urls.barriers.detail ).toHaveBeenCalledWith( barrier.id );
		} );

		describe( 'When the processor does not throw an error', () => {
			it( 'Should not call next', async () => {

				await controller.source( req, res, next );

				expect( next ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'When the processor throws an errror', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'a random error' );

				processor.process.and.callFake( () => { throw err; } );

				await controller.source( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
			} );
		} );
	} );

	describe( 'priority', () => {

		const template = 'barriers/views/edit/priority';
		let getBarrierPrioritiesListResponse;

		beforeEach( () => {

			getBarrierPrioritiesListResponse = [ { value: 1, html: 'test' } ];
			metadata.getBarrierPrioritiesList.and.callFake( () => getBarrierPrioritiesListResponse );
		} );

		it( 'Should configure the Form correctly', async () => {

			await controller.priority( req, res, next );

			const config = Form.calls.argsFor( 0 )[ 1 ];

			expect( config.priority ).toBeDefined();
			expect( config.priority.type ).toEqual( RADIO );
			expect( config.priority.values ).toEqual( [ barrier.priority.code ] );
			expect( config.priority.items ).toEqual( getBarrierPrioritiesListResponse );
			expect( config.priority.validators ).toBeDefined();
			expect( config.priority.validators.length ).toEqual( 1 );
			expect( config.priority.validators[ 0 ].fn ).toEqual( validators.isBarrierPriority );

			expect( config.priorityDescription ).toBeDefined();
		} );

		describe( 'When the barrier priority is unknown', () => {
			it( 'Should configure the FormProcessor correctly and set isUnknown to true', async () => {

				barrier.priority.code = 'UNKNOWN';

				await controller.priority( req, res );

				const config = FormProcessor.calls.argsFor( 0 )[ 0 ];
				const templateValues = { abc: '123' };
				const formValues = { def: 456 };
				const detailResponse = '/barrier/details';

				expect( config.form ).toEqual( form );
				expect( typeof config.render ).toEqual( 'function' );
				expect( typeof config.saveFormData ).toEqual( 'function' );
				expect( typeof config.saved ).toEqual( 'function' );

				config.render( templateValues );

				expect( res.render ).toHaveBeenCalledWith( template, { ...templateValues, isUnknown: true } );

				config.saveFormData( formValues );

				expect( backend.barriers.savePriority ).toHaveBeenCalledWith( req, barrier.id, formValues );

				urls.barriers.detail.and.callFake( () => detailResponse );

				config.saved();

				expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
				expect( urls.barriers.detail ).toHaveBeenCalledWith( barrier.id );
			} );
		} );

		describe( 'When the barrier priority is not unknown', () => {
			it( 'Should configure the FormProcessor correcty and set isUnknown to false', async () => {

				barrier.priority.code = 'HIGH';

				await controller.priority( req, res );

				const config = FormProcessor.calls.argsFor( 0 )[ 0 ];
				const templateValues = { abc: '123' };

				expect( config.form ).toEqual( form );

				config.render( templateValues );

				expect( res.render ).toHaveBeenCalledWith( template, { ...templateValues, isUnknown: false } );
			} );
		} );

		describe( 'When the processor does not throw an error', () => {
			it( 'Should not call next', async () => {

				await controller.priority( req, res, next );

				expect( next ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'When the processor throws an errror', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'a random error' );

				processor.process.and.callFake( () => { throw err; } );

				await controller.priority( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
			} );
		} );
	} );

	describe( 'status', () => {

		const template = 'barriers/views/edit/status';
		let barrier;

		beforeEach( () => {

			barrier = jasmine.helpers.getFakeData( '/backend/barriers/barrier' );
			validators.isDateValue = jasmine.createSpy( 'validators.isDateValue' );
			req.barrier = barrier;
			barrier.status.summary = 'hello';
		} );

		describe( 'Configuring the form for a resolved barrier', () => {

			let mockDateField;

			beforeEach( () => {

				mockDateField = { a: 1, b: 2 };
				barrierFields.createStatusDate.and.callFake( () => mockDateField );
			} );

			afterEach( () => {

				const config = Form.calls.argsFor( 0 )[ 1 ];

				expect( config.statusDate ).toEqual( mockDateField );
				expect( barrierFields.createStatusDate ) .toHaveBeenCalledWith( { year: '2019', month: '03', day: '01' } );

				expect( config.statusSummary ).toBeDefined();
				expect( config.statusSummary.required ).toBeDefined();
				expect( config.statusSummary.values ).toEqual( [ 'hello' ] );
			} );

			describe( 'When it is fully resolved', () => {
				it( 'Should configure the Form correctly', async () => {

					barrier.status.id = RESOLVED;

					await controller.status( req, res, next );
				});
			} );

			describe( 'When it is partially resolved', () => {
				it( 'Should configure the Form correctly', async () => {

					barrier.status.id = PART_RESOLVED;

					await controller.status( req, res, next );
				});
			} );
		});

		describe( 'Configuring the form for a paused barrier', () => {
			it( 'Should configure the Form correctly', async () => {

				barrier.status.id = PAUSED;

				await controller.status( req, res, next );

				const config = Form.calls.argsFor( 0 )[ 1 ];

				expect( config.statusDate ).toBeUndefined();

				expect( config.statusSummary ).toBeDefined();
				expect( config.statusSummary.required ).toBeDefined();
				expect( config.statusSummary.values ).toEqual( [ 'hello' ] );
			});
		});

		it( 'Should configure the FormProcessor correctly', async () => {

			await controller.status( req, res );

			const config = FormProcessor.calls.argsFor( 0 )[ 0 ];
			const templateValues = { abc: '123' };
			const formValues = { def: 456 };
			const detailResponse = '/barrier/details';

			expect( config.form ).toEqual( form );
			expect( typeof config.render ).toEqual( 'function' );
			expect( typeof config.saveFormData ).toEqual( 'function' );
			expect( typeof config.saved ).toEqual( 'function' );

			config.render( templateValues );

			expect( res.render ).toHaveBeenCalledWith( template, { ...templateValues, isResolved: false } );

			config.saveFormData( formValues );

			expect( backend.barriers.saveStatus ).toHaveBeenCalledWith( req, barrier.id, formValues );

			urls.barriers.detail.and.callFake( () => detailResponse );

			config.saved();

			expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
			expect( urls.barriers.detail ).toHaveBeenCalledWith( barrier.id );
		} );

		describe( 'When the processor does not throw an error', () => {
			it( 'Should not call next', async () => {

				await controller.status( req, res, next );

				expect( next ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'When the processor throws an errror', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'a random error' );

				processor.process.and.callFake( () => { throw err; } );

				await controller.status( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
			} );
		} );
	});

	describe( 'euExitRelated', () => {

		const template = 'barriers/views/edit/eu-exit-related';
		let barrier;
		let optionalBoolResponse;

		beforeEach( () => {

			optionalBoolResponse = { 'optionalBoolResponse': 'yes' };
			validators.isMetadata.and.callFake( () => optionalBoolResponse );
			barrier = jasmine.helpers.getFakeData( '/backend/barriers/barrier' );
			govukItemsFromObjResponse = [
				{
					value: 'true',
					text: 'yes'
				},{
					value: 'false',
					text: 'No'
				}
			];

			req.barrier = barrier;
		} );

		it( 'Should configure the Form correctly', async () => {

			await controller.euExitRelated( req, res, next );

			const config = Form.calls.argsFor( 0 )[ 1 ];

			expect( config.euExitRelated ).toBeDefined();
			expect( config.euExitRelated.type ).toEqual( RADIO );
			expect( config.euExitRelated.values ).toEqual( [ barrier.eu_exit_related ] );
			expect( config.euExitRelated.items ).toEqual( govukItemsFromObjResponse );
			expect( config.euExitRelated.validators[ 0 ].fn ).toEqual( optionalBoolResponse );
			expect( govukItemsFromObj ).toHaveBeenCalledWith( metadata.optionalBool );
			expect( validators.isMetadata ).toHaveBeenCalledWith( 'optionalBool' );
		});

		it( 'Should configure the FormProcessor correctly', async () => {

			await controller.euExitRelated( req, res );

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

			expect( backend.barriers.saveEuExitRelated ).toHaveBeenCalledWith( req, barrier.id, formValues );

			urls.barriers.detail.and.callFake( () => detailResponse );

			config.saved();

			expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
			expect( urls.barriers.detail ).toHaveBeenCalledWith( barrier.id );
		} );

		describe( 'When the processor does not throw an error', () => {
			it( 'Should not call next', async () => {

				await controller.euExitRelated( req, res, next );

				expect( next ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'When the processor throws an errror', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'a random error' );

				processor.process.and.callFake( () => { throw err; } );

				await controller.euExitRelated( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
			} );
		} );
	});

	describe( 'problemStatus', () => {

		const template = 'barriers/views/edit/problem-status';

		it( 'Should configure the Form correctly', async () => {

			const isMetadataResponse = { ab: '12', cd: '34' };

			validators.isMetadata.and.callFake( () => isMetadataResponse );

			await controller.problemStatus( req, res, next );

			const config = Form.calls.argsFor( 0 )[ 1 ];

			expect( config.problemStatus ).toBeDefined();
			expect( config.problemStatus.type ).toEqual( RADIO );
			expect( config.problemStatus.values ).toEqual( [ barrier.problem_status ] );
			expect( config.problemStatus.items ).toEqual( govukItemsFromObjResponse );
			expect( govukItemsFromObj ).toHaveBeenCalledWith( metadata.statusTypes );
			expect( config.problemStatus.validators.length ).toEqual( 1 );
			expect( config.problemStatus.validators[ 0 ].fn ).toEqual( isMetadataResponse );
			expect( validators.isMetadata ).toHaveBeenCalledWith( 'statusTypes' );
		} );

		it( 'Should configure the FormProcessor correctly', async () => {

			await controller.problemStatus( req, res );

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

			expect( backend.barriers.saveProblemStatus ).toHaveBeenCalledWith( req, barrier.id, formValues );

			urls.barriers.detail.and.callFake( () => detailResponse );

			config.saved();

			expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
			expect( urls.barriers.detail ).toHaveBeenCalledWith( barrier.id );
		} );

		describe( 'When the processor does not throw an error', () => {
			it( 'Should not call next', async () => {

				await controller.problemStatus( req, res, next );

				expect( next ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'When the processor throws an errror', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'a random error' );

				processor.process.and.callFake( () => { throw err; } );

				await controller.problemStatus( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
			} );
		} );
	} );
} );
