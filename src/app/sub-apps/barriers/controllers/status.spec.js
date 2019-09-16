const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const HttpResponseError = require( '../../../lib/HttpResponseError' );
const metadata = require( '../../../lib/metadata' );

const modulePath = './status';

const GROUP = 'group';
const RADIO = 'select';

const statusTypes = metadata.barrier.status.types;
const { UNKNOWN, PENDING, OPEN, PART_RESOLVED, RESOLVED, HIBERNATED } = statusTypes;

describe( 'Barrier status controller', () => {

	let controller;
	let req;
	let res;
	let next;
	let backend;
	let urls;
	let Form;
	let form;
	let getValuesResponse;
	let getTemplateValuesResponse;
	let validators;
	let validTypes;
	let govukItemsFromObj;
	let govukItemsFromObjResponse;
	let barrierFields;

	beforeEach( () => {

		({ req, res, next } = jasmine.helpers.mocks.middleware());

		backend = {
			barriers: {
				setStatus:{
					unknown: jasmine.createSpy( 'backend.barriers.unknown' ),
					pending: jasmine.createSpy( 'backend.barriers.pending' ),
					open: jasmine.createSpy( 'backend.barriers.setStatus.open' ),
					partResolved: jasmine.createSpy( 'backend.barriers.partResolved' ),
					resolved: jasmine.createSpy( 'backend.barriers.setStatus.resolvedd' ),
					hibernated: jasmine.createSpy( 'backend.barriers.setStatus.hibernatedd' ),
				}
			}
		};

		urls = {
			index: jasmine.createSpy( 'urls.index' ),
			barriers: {
				detail: jasmine.createSpy( 'urls.barriers.detail' ),
			}
		};

		metadata.barrierPendingOptions = { a: 1, b: 2, };

		govukItemsFromObjResponse = [ { value: 1, text: 'beep' }, { value: 2, text: 'boop' } ];
		govukItemsFromObj = jasmine.createSpy( 'govukItemsfromObj' ).and.callFake( () => govukItemsFromObjResponse );

		getValuesResponse = { a: 1, b: 2 };
		getTemplateValuesResponse = { c: 3, d: 4 };
		form = {
			validate: jasmine.createSpy( 'form.validate' ),
			getValues: jasmine.createSpy( 'form.getValues' ).and.callFake( () => getValuesResponse ),
			getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.callFake( () => getTemplateValuesResponse )
		};

		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );
		Form.GROUP = GROUP;
		Form.RADIO = RADIO;

		validators = {
			isBarrierStatus: jasmine.createSpy( 'validators.isBarrierStatus' ),
		};

		barrierFields = {
			createStatusDate: jasmine.createSpy( 'barrierFields.createStatusDate' ),
		};

		controller = proxyquire( modulePath, {
			'../../../lib/backend-service': backend,
			'../../../lib/urls': urls,
			'../../../lib/Form': Form,
			'../../../lib/validators': validators,
			'../../../lib/metadata': metadata,
			'../../../lib/govuk-items-from-object': govukItemsFromObj,
			'../../../lib/barrier-fields': barrierFields,
		} );
	} );

	describe( 'status.index', () => {

		const TEMPLATE = 'barriers/views/status/index';

		let barrier;
		let detailUrl;
		let statusDateField;

		function checkSummary( field, value ){

			expect( field ).toBeDefined();
			expect( field.conditional ).toEqual( { name: 'status', value } );
			expect( field.required ).toBeDefined();
			expect( field.errorField ).toEqual( 'summary' );
		}

		function checkDateField( field, value, index, monthName, yearName ){

			expect( field ).toEqual( {
				...statusDateField,
				conditional: { name: 'status', value },
				errorField: 'status_date',
			} );

			const expectedArgs = [ {} ];

			if( monthName ){ expectedArgs.push( monthName ); }
			if( yearName ){ expectedArgs.push( yearName ); }

			expect( barrierFields.createStatusDate.calls.argsFor( index ) ).toEqual( expectedArgs );
		}

		function checkFormConfig( validTypes ){

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];

			expect( Form ).toHaveBeenCalled();
			expect( args[ 0 ] ).toEqual( req );

			expect( config.status ).toBeDefined();
			expect( config.status.type ).toEqual( RADIO );
			expect( config.status.values ).toEqual( [ barrier.status.id ] );
			expect( Array.isArray( config.status.items ) ).toEqual( true );
			expect( typeof config.status.validators[ 0 ].fn ).toEqual( 'function' );

			if( validTypes.includes( RESOLVED ) ){

				checkDateField( config.resolvedDate, RESOLVED, 1 );
				checkSummary( config.resolvedSummary, RESOLVED );

			} else {

				expect( config.resolvedDate ).not.toBeDefined();
				expect( config.resolvedSummary ).not.toBeDefined();
			}

			if( validTypes.includes( PART_RESOLVED ) ){

				checkDateField( config.partResolvedDate, PART_RESOLVED, 0, 'partMonth', 'partYear' );
				checkSummary( config.partResolvedSummary, PART_RESOLVED );

			} else {

				expect( config.partResolvedDate ).not.toBeDefined();
				expect( config.partResolvedSummary ).not.toBeDefined();
			}

			if( validTypes.includes( HIBERNATED ) ){

				checkSummary( config.hibernationSummary, HIBERNATED );

			} else {

				expect( config.hibernationSummary ).not.toBeDefined();
			}

			if( validTypes.includes( OPEN ) )	{

				checkSummary( config.reopenSummary, OPEN );

			} else {

				expect( config.reopenSummary ).not.toBeDefined();
			}

			if( validTypes.includes( UNKNOWN ) ){

				checkSummary( config.unknownSummary, UNKNOWN );

			} else {

				expect( config.unknownSummary ).not.toBeDefined();
			}

			if( validTypes.includes( PENDING ) ){

				expect( config.pendingType ).toBeDefined();
				expect( config.pendingType.conditional ).toEqual( { name: 'status', value: PENDING } );
				expect( config.pendingType.required ).toBeDefined();
				expect( config.pendingType.type ).toEqual( RADIO );
				expect( config.pendingType.items ).toEqual( govukItemsFromObjResponse );
				expect( govukItemsFromObj ).toHaveBeenCalledWith( metadata.barrierPendingOptions );

				expect( config.pendingTypeOther ).toBeDefined();
				expect( config.pendingTypeOther.conditional ).toEqual( { name: 'pendingType', value: metadata.barrier.status.pending.OTHER } );
				expect( config.pendingTypeOther.required ).toBeDefined();

				checkSummary( config.pendingSummary, PENDING );

			} else {

				expect( config.pendingSummary ).not.toBeDefined();
			}

			return config;
		}

		function createValidTypes( keyToRemove ){

			const types = { ...statusTypes };

			for( let [ key, value ] of Object.entries( types ) ){

				if( value === keyToRemove ){

					delete types[ key ];
					break;
				}
			}

			return Object.values( types );
		}

		beforeEach( () => {

			barrier = {
				id: uuid(),
				status: {},
			};
			req.barrier = barrier;

			statusDateField = { a: uuid(), b: uuid() };
			barrierFields.createStatusDate.and.callFake( () => ({ ...statusDateField }) );

			detailUrl = '/barrier-detail/';
			urls.barriers.detail.and.callFake( () => detailUrl );
		} );

		describe( 'When the current status is OPEN', () => {

			let templateData;

			beforeEach( () => {

				barrier.status.id = Number( OPEN );
				validTypes = createValidTypes( OPEN );

				templateData = {
					...getTemplateValuesResponse,
					statusTypes,
					validTypes,
					pendingOther: metadata.barrier.status.pending.OTHER,
				};
			} );

			it( 'Should setup the form correctly', () => {

				controller.index( req, res );

				const config = checkFormConfig( validTypes );
				const isValidType = config.status.validators[ 0 ].fn;

				validators.isBarrierStatus.and.callFake( () => true );
				expect( isValidType( OPEN ) ).toEqual( false );
				expect( isValidType( RESOLVED ) ).toEqual( true );

				validators.isBarrierStatus.and.callFake( () => false );
				expect( isValidType( OPEN ) ).toEqual( false );
				expect( isValidType( RESOLVED ) ).toEqual( false );

			} );

			describe( 'When it is a GET', () => {
				it( 'Should render the view with the viewModel', async () => {

					await controller.index( req, res, next );

					expect( form.validate ).not.toHaveBeenCalled();
					expect( form.getTemplateValues ).toHaveBeenCalledWith();
					expect( res.render ).toHaveBeenCalledWith( TEMPLATE, templateData );
				} );
			} );

			describe( 'When it is a POST', () => {

				beforeEach( () => {

					form.isPost = true;
				} );

				afterEach( () => {

					expect( form.validate ).toHaveBeenCalled();
				} );

				describe( 'When the required values are empty', () => {
					it( 'Should render the template', async () => {

						form.hasErrors = () => true;

						await controller.index( req, res, next );

						expect( res.render ).toHaveBeenCalledWith( TEMPLATE, templateData );
					} );
				} );

				describe( 'When the required values are filled', () => {
					describe( 'When it is RESOLVED', () => {

						beforeEach( () => {

							getValuesResponse.status = RESOLVED;
						} );

						describe( 'When the response is a success', () => {

							beforeEach( () => {

								backend.barriers.setStatus.resolved.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );
								form.hasErrors = () => false;
							} );

							afterEach( () => {

								expect( next ).not.toHaveBeenCalled();
								expect( backend.barriers.setStatus.resolved ).toHaveBeenCalledWith( req, req.barrier.id, getValuesResponse );
							} );

							describe( 'When the form is saved', () => {
								it( 'Should redirect', async () => {

									await controller.index( req, res, next );

									expect( urls.barriers.detail ).toHaveBeenCalledWith( req.barrier.id );
									expect( res.redirect ).toHaveBeenCalledWith( detailUrl );
								} );
							} );
						} );

						describe( 'When the response is not a success', () => {
							describe( 'When the error is a 400', () => {

								let statusCode;
								let fields;

								beforeEach( () => {

									statusCode = 400;
									fields = { a: 1, b: 2 };

									backend.barriers.setStatus.resolved.and.callFake( () => Promise.resolve( {
										response: { isSuccess: false, statusCode },
										body: { fields }
									} ) );

									form.addErrors = jasmine.createSpy( 'form.addErrors' );
								} );

								describe( 'When the fields match', () => {
									it( 'Should call form.addErrors and render the page', async () => {

										form.hasErrors = () => false;
										form.addErrors.and.callFake( () => {
											form.hasErrors = () => true;
										} );

										await controller.index( req, res, next );

										expect( form.addErrors ).toHaveBeenCalledWith( fields );
										expect( res.render ).toHaveBeenCalledWith( TEMPLATE, templateData );
									} );
								} );

								describe( 'When the fields do not match', () => {
									it( 'Should call next with an error', async () => {

										form.hasErrors = () => false;

										await controller.index( req, res, next );

										expect( next ).toHaveBeenCalled();
										expect( next.calls.argsFor( 0 )[ 0 ] instanceof HttpResponseError ).toEqual( true );
									} );
								} );
							} );

							describe( 'When it is a unknown error', () => {
								it( 'Should call next with an error', async () => {

									const statusCode = 500;
									form.hasErrors = () => false;
									backend.barriers.setStatus.resolved.and.callFake( () => Promise.resolve( {
										response: { isSuccess: false, statusCode }
									} ) );

									await controller.index( req, res, next );

									expect( next ).toHaveBeenCalled();
									expect( next.calls.argsFor( 0 )[ 0 ] instanceof HttpResponseError ).toEqual( true );
								} );
							} );
						} );

						describe( 'When the request fails', () => {
							it( 'Should call next with the error', async () => {

								const err = new Error( 'my test' );
								form.hasErrors = () => false;
								backend.barriers.setStatus.resolved.and.callFake( () => Promise.reject( err ) );

								await controller.index( req, res, next );

								expect( next ).toHaveBeenCalledWith( err );
							} );
						} );
					} );

					describe( 'When it is HIBERNATED', () => {

						beforeEach( () => {

							getValuesResponse.status = HIBERNATED;
						} );

						describe( 'When the response is a success', () => {

							beforeEach( () => {

								backend.barriers.setStatus.hibernated.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );
								form.hasErrors = () => false;
							} );

							afterEach( () => {

								expect( next ).not.toHaveBeenCalled();
								expect( backend.barriers.setStatus.hibernated ).toHaveBeenCalledWith( req, req.barrier.id, getValuesResponse );
							} );

							describe( 'When the form is saved', () => {
								it( 'Should redirect', async () => {

									await controller.index( req, res, next );

									expect( urls.barriers.detail ).toHaveBeenCalledWith( req.barrier.id );
									expect( res.redirect ).toHaveBeenCalledWith( detailUrl );
								} );
							} );
						} );

						describe( 'When the response is not a success', () => {
							describe( 'When the error is a 400', () => {

								let statusCode;
								let fields;

								beforeEach( () => {

									statusCode = 400;
									fields = { a: 1, b: 2 };

									backend.barriers.setStatus.hibernated.and.callFake( () => Promise.resolve( {
										response: { isSuccess: false, statusCode },
										body: { fields }
									} ) );

									form.addErrors = jasmine.createSpy( 'form.addErrors' );
								} );

								describe( 'When the fields match', () => {
									it( 'Should call form.addErrors and render the page', async () => {


										form.hasErrors = () => false;
										form.addErrors.and.callFake( () => {
											form.hasErrors = () => true;
										} );

										await controller.index( req, res, next );

										expect( form.addErrors ).toHaveBeenCalledWith( fields );
										expect( res.render ).toHaveBeenCalledWith( TEMPLATE, templateData );
									} );
								} );

								describe( 'When the fields do not match', () => {
									it( 'Should call next with an error', async () => {

										form.hasErrors = () => false;

										await controller.index( req, res, next );

										expect( next ).toHaveBeenCalled();
										expect( next.calls.argsFor( 0 )[ 0 ] instanceof HttpResponseError ).toEqual( true );
									} );
								} );
							} );

							describe( 'When it is a unknown error', () => {
								it( 'Should call next with an error', async () => {

									const statusCode = 500;
									form.hasErrors = () => false;
									backend.barriers.setStatus.hibernated.and.callFake( () => Promise.resolve( {
										response: { isSuccess: false, statusCode }
									} ) );

									await controller.index( req, res, next );

									expect( next ).toHaveBeenCalled();
									expect( next.calls.count() ).toEqual( 1 );
									expect( next.calls.argsFor( 0  )[ 0 ] instanceof HttpResponseError ).toEqual( true );
								} );
							} );
						} );

						describe( 'When the request fails', () => {
							it( 'Should call next with the error', async () => {

								const err = new Error( 'my test' );
								form.hasErrors = () => false;
								backend.barriers.setStatus.hibernated.and.callFake( () => Promise.reject( err ) );

								await controller.index( req, res, next );

								expect( next ).toHaveBeenCalledWith( err );
							} );
						} );
					} );

					describe( 'When it is PART_RESOLVED', () => {

						let month;
						let year;

						beforeEach( () => {

							month = '03';
							year = '2019';

							getValuesResponse.status = PART_RESOLVED;
							getValuesResponse.partResolvedDate = {
								partMonth: month,
								partYear: year,
							};
						} );

						describe( 'When the response is a success', () => {

							beforeEach( () => {

								backend.barriers.setStatus.partResolved.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );
								form.hasErrors = () => false;
							} );

							afterEach( () => {

								expect( next ).not.toHaveBeenCalled();
								expect( backend.barriers.setStatus.partResolved ).toHaveBeenCalledWith( req, req.barrier.id, {
									...getValuesResponse,
									partResolvedDate: { month, year },
								} );
							} );

							describe( 'When the form is saved', () => {
								it( 'Should redirect', async () => {

									await controller.index( req, res, next );

									expect( urls.barriers.detail ).toHaveBeenCalledWith( req.barrier.id );
									expect( res.redirect ).toHaveBeenCalledWith( detailUrl );
								} );
							} );
						} );
					} );

					describe( 'When it is UNKNOWN', () => {

						beforeEach( () => {

							getValuesResponse.status = UNKNOWN;
						} );

						describe( 'When the response is a success', () => {

							beforeEach( () => {

								backend.barriers.setStatus.unknown.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );
								form.hasErrors = () => false;
							} );

							afterEach( () => {

								expect( next ).not.toHaveBeenCalled();
								expect( backend.barriers.setStatus.unknown ).toHaveBeenCalledWith( req, req.barrier.id, getValuesResponse );
							} );

							describe( 'When the form is saved', () => {
								it( 'Should redirect', async () => {

									await controller.index( req, res, next );

									expect( urls.barriers.detail ).toHaveBeenCalledWith( req.barrier.id );
									expect( res.redirect ).toHaveBeenCalledWith( detailUrl );
								} );
							} );
						} );
					} );

					describe( 'When it is PENDING', () => {

						beforeEach( () => {

							getValuesResponse.status = PENDING;
						} );

						describe( 'When the response is a success', () => {

							beforeEach( () => {

								backend.barriers.setStatus.pending.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );
								form.hasErrors = () => false;
							} );

							afterEach( () => {

								expect( next ).not.toHaveBeenCalled();
								expect( backend.barriers.setStatus.pending ).toHaveBeenCalledWith( req, req.barrier.id, getValuesResponse );
							} );

							describe( 'When the form is saved', () => {
								it( 'Should redirect', async () => {

									await controller.index( req, res, next );

									expect( urls.barriers.detail ).toHaveBeenCalledWith( req.barrier.id );
									expect( res.redirect ).toHaveBeenCalledWith( detailUrl );
								} );
							} );
						} );
					} );
				} );
			} );
		} );

		describe( 'When the current status is RESOLVED', () => {

			beforeEach( () => {

				barrier.status.id = Number( RESOLVED );
				validTypes = createValidTypes( RESOLVED );
			} );

			it( 'Should setup the form correctly', () => {

				controller.index( req, res );

				checkFormConfig( validTypes );
			} );

			describe( 'When it is a POST', () => {

				beforeEach( () => {

					req.body = {};
					form.isPost = true;
				} );

				afterEach( () => {

					expect( form.validate ).toHaveBeenCalled();
				} );

				describe( 'When the required values are filled', () => {
					describe( 'When it is OPEN', () => {

						beforeEach( () => {

							getValuesResponse.status = OPEN;
						} );

						describe( 'When the response is a success', () => {

							beforeEach( () => {

								backend.barriers.setStatus.open.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );
								form.hasErrors = () => false;
							} );

							afterEach( () => {

								expect( next ).not.toHaveBeenCalled();
								expect( backend.barriers.setStatus.open ).toHaveBeenCalledWith( req, req.barrier.id, getValuesResponse );
							} );

							describe( 'When the form is saved', () => {
								it( 'Should redirect', async () => {

									await controller.index( req, res, next );

									expect( urls.barriers.detail ).toHaveBeenCalledWith( req.barrier.id );
									expect( res.redirect ).toHaveBeenCalledWith( detailUrl );
								} );
							} );
						} );
					} );
				} );
			} );
		} );

		describe( 'When the current status is HIBERNATED', () => {

			beforeEach( () => {

				barrier.status.id = Number( HIBERNATED );
				validTypes = createValidTypes( HIBERNATED );
			} );

			it( 'Should setup the form correctly', () => {

				controller.index( req, res );

				checkFormConfig( validTypes );
			} );
		} );

		describe( 'When the current status is UNKNOWN', () => {

			beforeEach( () => {

				barrier.status.id = Number( UNKNOWN );
				validTypes = createValidTypes( UNKNOWN );
			} );

			it( 'Should setup the form correctly', () => {

				controller.index( req, res );

				checkFormConfig( validTypes );
			} );
		} );

		describe( 'When the current status is PART_RESOLVED', () => {

			beforeEach( () => {

				barrier.status.id = Number( PART_RESOLVED );
				validTypes = createValidTypes( PART_RESOLVED );
			} );

			it( 'Should setup the form correctly', () => {

				controller.index( req, res );

				checkFormConfig( validTypes );
			} );
		} );

		describe( 'When the current status is PENDING', () => {

			beforeEach( () => {

				barrier.status.id = Number( PENDING );
				validTypes = createValidTypes( PENDING );
			} );

			it( 'Should setup the form correctly', () => {

				controller.index( req, res );

				checkFormConfig( validTypes );
			} );
		} );
	} );
} );
