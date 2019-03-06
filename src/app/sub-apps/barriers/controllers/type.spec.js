const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

const modulePath = './type';

const GROUP = 'group';
const SELECT = 'select';

describe( 'Barrier type controller', () => {

	let controller;
	let req;
	let res;
	let next;
	let backend;
	let urls;
	let csrfToken;
	let Form;
	let form;
	let getValuesResponse;
	let getTemplateValuesResponse;
	let validators;
	let barrierId;
	let metadata;

	beforeEach( () => {

		csrfToken = uuid();
		barrierId = uuid();

		req = {
			barrier: {
				id: barrierId
			},
			csrfToken: () => csrfToken,
			session: {},
			params: {}
		};
		res = {
			render: jasmine.createSpy( 'res.render' ),
			redirect: jasmine.createSpy( 'res.redirect' )
		};
		next = jasmine.createSpy( 'next' );
		backend = {
			barriers: {
				saveType: jasmine.createSpy( 'backend.barriers.saveType' ),
			}
		};

		urls = {
			index: jasmine.createSpy( 'urls.index' ),
			barriers: {
				detail: jasmine.createSpy( 'urls.barriers.detail' ),
				type: {
					list: jasmine.createSpy( 'urls.barriers.type.list' )
				},
			}
		};

		metadata = {
			barrierTypes: [
				{ id: 1, title: 'barrier 1', category: 'GOODS', description: 'some text 1' },
				{ id: 2, title: 'barrier 2', category: 'GOODS', description: 'some text 2' },
				{ id: 3, title: 'barrier 3', category: 'SERVICES', description: 'a bit more text' }
			],
			barrierTypeCategories: {
				'GOODS': 'title 1',
				'SERVICES': 'title 2'
			},
		};

		getValuesResponse = { a: 1, b: 2 };
		getTemplateValuesResponse = { c: 3, d: 4 };
		form = {
			validate: jasmine.createSpy( 'form.validate' ),
			getValues: jasmine.createSpy( 'form.getValues' ).and.callFake( () => getValuesResponse ),
			getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.callFake( () => getTemplateValuesResponse )
		};
		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );
		Form.GROUP = GROUP;
		Form.SELECT = SELECT;

		validators = {
			isMetadata: jasmine.createSpy( 'validators.isMetadata' ),
			isBarrierType: jasmine.createSpy( 'validators.isBarrierType' ),
		};

		controller = proxyquire( modulePath, {
			'../../../lib/backend-service': backend,
			'../../../lib/urls': urls,
			'../../../lib/Form': Form,
			'../../../lib/validators': validators,
			'../../../lib/metadata': metadata
		} );
	} );

	describe( 'type.category', () => {

		let ssoToken;
		let report;

		beforeEach( () => {

			ssoToken = uuid();
			req.session = { ssoToken };
			report = {
				id: 123,
				barrier_type_category: 'barrier_type_category'
			};
			req.report = report;
		} );

		describe( 'form setup', () => {

			const barrierTypeCategories = { barrierTypeCategories: 1 };

			beforeEach( () => {

				validators.isMetadata.and.callFake( () => barrierTypeCategories );
			} );

			afterEach( () => {

				const args = Form.calls.argsFor( 0 );
				const config = args[ 1 ];

				expect( Form ).toHaveBeenCalled();
				expect( args[ 0 ] ).toEqual( req );

				expect( config.category ).toBeDefined();
				expect( config.category.type ).toEqual( Form.RADIO );
				expect( config.category.items.length ).toEqual( Object.entries( metadata.barrierTypeCategories ).length );
				expect( config.category.validators[ 0 ].fn ).toEqual( barrierTypeCategories );
			} );

			describe( 'When there is not a barrier', () => {
				it( 'Should setup the form correctly', () => {

					controller.category( req, res );

					const config = Form.calls.argsFor( 0 )[ 1 ];

					expect( config.category.values ).toEqual( [] );
				} );
			} );

			describe( 'When there is not a barrier', () => {
				it( 'Should setup the form correctly', () => {

					const barrier = {
						barrier_type: {
							category: 'abc-123'
						}
					};

					req.barrier = barrier;

					controller.category( req, res );

					const config = Form.calls.argsFor( 0 )[ 1 ];
					expect( config.category.values ).toEqual( [ barrier.barrier_type.category ] );
				} );
			} );
		} );

		describe( 'When it is a POST', () => {

			beforeEach( () => {

				req.method = 'POST';
				req.body = {};
				form.isPost = true;
			} );

			describe( 'When the input values are valid', () => {

				it( 'Should save the values and redirect to the next step', () => {

					const listUrl = 'my-url';
					const category = '123';

					req.body = { category };
					getValuesResponse = { category };
					form.hasErrors = () => false;

					urls.barriers.type.list.and.callFake( () => listUrl );

					controller.category( req, res );

					expect( form.validate ).toHaveBeenCalled();
					expect( urls.barriers.type.list ).toHaveBeenCalledWith( barrierId, category );
					expect( res.redirect ).toHaveBeenCalledWith( listUrl );
				} );
			} );

			describe( 'When no input values are given', () => {

				beforeEach( () => {

					form.hasErrors = () => true;
				} );

				it( 'Should render the template with the form values', () => {

					controller.category( req, res );
					expect( res.render ).toHaveBeenCalledWith( 'barriers/views/type/category', getTemplateValuesResponse );
				} );
			} );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the template with the form values', () => {

				const sessionValues = { category: 'GOODS' };

				req.session.typeCategoryValues = sessionValues;

				controller.category( req, res );

				expect( form.getTemplateValues ).toHaveBeenCalledWith();
				expect( res.render ).toHaveBeenCalledWith( 'barriers/views/type/category', getTemplateValuesResponse );
			} );
		} );
	} );

	describe( 'type.list', () => {

		let barrier;
		let templateData;
		let category;

		beforeEach( () => {

			barrier = {
				id: 123,
				barrier_type: { id: 456 }
			};

			category = 'GOODS';

			req.barrier = barrier;
			req.category = category;

			getTemplateValuesResponse = {
				barrierType: [
					{ value: 1, text: 'barrier 2', category: 'GOODS', description: 'some text 2' },
					{ value: 2, text: 'barrier 1', category: 'GOODS', description: 'some text 1' },
					{ value: 3, text: 'barrier 3', category: 'SERVICES', description: 'a bit more text' }
				]
			};

			templateData = Object.assign(
				getTemplateValuesResponse,
				{ title: metadata.barrierTypeCategories.GOODS }
			);
		} );

		it( 'Should setup the form correctly', async () => {

			await controller.list( req, res, next );

			expect( Form ).toHaveBeenCalled();

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];
			const goodsBarrierType1 = metadata.barrierTypes[ 0 ];
			const goodsBarrierType2 = metadata.barrierTypes[ 1 ];

			expect( args[ 0 ] ).toEqual( req );

			expect( config.barrierType ).toBeDefined();
			expect( config.barrierType.type ).toEqual( Form.RADIO );
			expect( config.barrierType.items ).toEqual( [{
				value: goodsBarrierType1.id,
				text: goodsBarrierType1.title,
				category: goodsBarrierType1.category,
				conditional: { html: `<div class="conditional-barrier-type-content">${ goodsBarrierType1.description }</div>` }
			},{
				value: goodsBarrierType2.id,
				text: goodsBarrierType2.title,
				category: goodsBarrierType2.category,
				conditional: { html: `<div class="conditional-barrier-type-content">${ goodsBarrierType2.description }</div>` }
			}] );
			expect( config.barrierType.values ).toEqual( [ barrier.barrier_type.id ] );
			expect( config.barrierType.validators[ 0 ].fn ).toEqual( validators.isBarrierType );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the view with the viewModel', async () => {

				await controller.list( req, res, next );

				expect( form.validate ).not.toHaveBeenCalled();
				expect( form.getTemplateValues ).toHaveBeenCalledWith();
				expect( res.render ).toHaveBeenCalledWith( 'barriers/views/type/list', templateData );
			} );
		} );

		describe( 'When it is a POST', () => {

			beforeEach( () => {

				req.body = {};
				form.isPost = true;
			} );

			afterEach( () => {

				expect( form.validate ).toHaveBeenCalled();
			} );

			describe( 'When the required values are empty', () => {
				it( 'Should render the template', async () => {

					form.hasErrors = () => true;

					await controller.list( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( 'barriers/views/type/list', templateData );
				} );
			} );

			describe( 'When the required values are filled', () => {
				describe( 'When the response is a success', () => {

					beforeEach( () => {

						backend.barriers.saveType.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );

						req.barrier = { id: 1, b: 2 };
						form.hasErrors = () => false;
					} );

					afterEach( () => {

						expect( next ).not.toHaveBeenCalled();
						expect( req.session.typeCategoryValues ).not.toBeDefined();
						expect( backend.barriers.saveType ).toHaveBeenCalledWith( req, req.barrier.id, getValuesResponse, category );
					} );

					describe( 'When save and exit is used to submit the form', () => {
						it( 'Should redirect to the barrier detail page', async () => {

							const barrierDetailResponse = '/barrierDetail';
							urls.barriers.detail.and.callFake( () => barrierDetailResponse );
							form.isExit = true;

							await controller.list( req, res, next );

							expect( urls.barriers.detail ).toHaveBeenCalledWith( req.barrier.id );
							expect( res.redirect ).toHaveBeenCalledWith( barrierDetailResponse );
						} );
					} );

					describe( 'When save and continue is used to submit the form', () => {
						it( 'Should redirect', async () => {

							const detailResponse = '/detail/';
							urls.barriers.detail.and.callFake( () => detailResponse );

							await controller.list( req, res, next );

							expect( urls.barriers.detail ).toHaveBeenCalledWith( req.barrier.id );
							expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
						} );
					} );
				} );

				describe( 'When the response is not a success', () => {
					it( 'Should call next with an error', async () => {

						const statusCode = 500;
						form.hasErrors = () => false;
						backend.barriers.saveType.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

						await controller.list( req, res, next );

						expect( next ).toHaveBeenCalledWith( new Error( 'Unable to save form - got 500 from backend' ) );
					} );
				} );

				describe( 'When the request fails', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'my test' );
						form.hasErrors = () => false;
						backend.barriers.saveType.and.callFake( () => Promise.reject( err ) );

						await controller.list( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
					} );
				} );
			} );
		} );
	} );
} );
