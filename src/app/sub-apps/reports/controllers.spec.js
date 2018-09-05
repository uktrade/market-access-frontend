const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

const modulePath = './controllers';

xdescribe( 'Report controller', () => {

	let controller;
	let req;
	let res;
	let next;
	let datahub;
	let backend;
	let urls;
	let csrfToken;
	let metadata;
	let Form;
	let form;
	let getValuesResponse;
	let getTemplateValuesResponse;
	let validators;
	let reportDetailViewModel;
	let reportsViewModel;

	beforeEach( () => {

		csrfToken = uuid();
		metadata = {
			reportTaskList: [ { a: 1, b: 2 }, { c: 3, d: 4 } ],
			statusTypes: { a: 1, b: 2 },
			bool: { 'true': 'Yes', 'false': 'No' },
			boolScale: { '1': 'Yes', '2': 'No' },
			lossScale: { '1': '1', '2': '2' },
			govResponse: { '1': 'z', 'b': 'y' },
			publishResponse: { a: 1, b: 2 },
			countries: [
				{ id: 1, name: 'country 1' },
				{ id: 2, name: 'country 2' }
			],
			barrierTypes: [
				{ id: 1, title: 'barrier 1', category: 'GOODS' },
				{ id: 2, title: 'barrier 2', category: 'SERVICES' }
			],
			barrierTypeCategories: {
				'GOODS': 'title 1',
				'SERVICES': 'title 2'
			},
			supportType: { '1': 'x', '2': 'y', '3': 'z' }
		};

		req = {
			query: {},
			csrfToken: () => csrfToken,
			session: {},
			params: {},
			error: jasmine.createSpy( 'req.error' ),
			hasErrors: jasmine.createSpy( 'req.hasErrors' )
		};
		res = {
			render: jasmine.createSpy( 'res.render' ),
			redirect: jasmine.createSpy( 'res.redirect' )
		};
		next = jasmine.createSpy( 'next' );
		backend = {
			reports: {
				save: jasmine.createSpy( 'backend.reports.save' ),
				update: jasmine.createSpy( 'backend.reports.update' ),
				saveProblem: jasmine.createSpy( 'backend.reports.saveProblem' ),
				saveImpact: jasmine.createSpy( 'backend.reports.saveImpact' ),
				saveLegal: jasmine.createSpy( 'backend.reports.saveLegal' ),
				saveBarrierType: jasmine.createSpy( 'backend.reports.saveBarrierType' ),
				saveSupport: jasmine.createSpy( 'backend.reports.saveSupport' ),
				saveNextSteps: jasmine.createSpy( 'backend.reports.saveNextSteps' ),
				submit: jasmine.createSpy( 'backend.reports.submit' ),
				getAll: jasmine.createSpy( 'backend.reports.getAll' ),
				getAllUnfinished: jasmine.createSpy( 'backend.reports.getAllUnfinished' )
			}
		};
		datahub = {
			searchCompany: jasmine.createSpy( 'datahub.searchCompany' )
		};
		urls = {
			index: jasmine.createSpy( 'urls.index' ),
			reports: {
				isResolved: jasmine.createSpy( 'urls.reports.isResolved' ),
				companySearch: jasmine.createSpy( 'urls.reports.companySearch' ),
				companyDetails: jasmine.createSpy( 'urls.reports.companyDetails' ),
				contacts: jasmine.createSpy( 'urls.reports.contacts' ),
				aboutProblem: jasmine.createSpy( 'urls.reports.aboutProblem' ),
				legal: jasmine.createSpy( 'urls.reports.legal' ),
				typeCategory: jasmine.createSpy( 'urls.reports.typeCategory' ),
				type: jasmine.createSpy( 'urls.reports.type' ),
				detail: jasmine.createSpy( 'urls.reports.detail' ),
				success: jasmine.createSpy( 'urls.reports.success' )
			}
		};

		getValuesResponse = { a: 1, b: 2 };
		getTemplateValuesResponse = { c: 3, d: 4 };
		form = {
			validate: jasmine.createSpy( 'form.validate' ),
			getValues: jasmine.createSpy( 'form.getValues' ).and.callFake( () => getValuesResponse ),
			getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.callFake( () => getTemplateValuesResponse )
		};
		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );
		reportDetailViewModel = jasmine.createSpy( 'reportDetailViewModel' );
		reportsViewModel = jasmine.createSpy( 'reportsViewModel' );

		validators = {
			isMetadata: jasmine.createSpy( 'validators.isMetaData' ),
			isCountry: jasmine.createSpy( 'validators.isCountry' ),
			isOneBoolCheckboxChecked: jasmine.createSpy( 'validators.isOneBoolCheckboxChecked' ),
			isBarrierType: jasmine.createSpy( 'validators.isBarrierType' )
		};

		controller = proxyquire( modulePath, {
			'../../lib/backend-service': backend,
			'../../lib/datahub-service': datahub,
			'../../lib/urls': urls,
			'../../lib/metadata': metadata,
			'../../lib/Form': Form,
			'../../lib/validators': validators,
			'./view-models/detail': reportDetailViewModel,
			'./view-models/reports': reportsViewModel
		} );
	} );

	function checkFormError( ...errors ){

		const calls = req.error.calls;
		let i = 0;
		let err;
		let args;

		expect( calls.count() ).toEqual( errors.length );

		while( ( err = errors[ i ] ) ){

			args = calls.argsFor( i );

			expect( args[ 0 ] ).toEqual( err );
			expect( args[ 1 ].length ).toBeGreaterThan( 0 );

			i++;
		}
	}

	describe( 'Index', () => {
		describe( 'Without an error', () => {
			describe( 'With a success response', () => {
				it( 'Should get the reports and render the index page', async () => {

					const unfinishedReportsResponse = {
						response: { isSuccess: true  },
						body: {
							results: [ { id: 1 } ]
						}
					};
					const reportsViewModelResponse = { reports: true };

					reportsViewModel.and.callFake( () => reportsViewModelResponse );
					backend.reports.getAllUnfinished.and.callFake( () => Promise.resolve( unfinishedReportsResponse ) );

					await controller.index( req, res, next );

					expect( next ).not.toHaveBeenCalled();
					expect( backend.reports.getAllUnfinished ).toHaveBeenCalledWith( req );
					expect( reportsViewModel ).toHaveBeenCalledWith( unfinishedReportsResponse.body.results );
					expect( res.render ).toHaveBeenCalledWith( 'reports/views/index', reportsViewModelResponse );
				} );
			} );

			describe( 'Without a success response', () => {
				it( 'Should get the reports and render the index page', async () => {

					const unfinishedReportsResponse = {
						response: { isSuccess: false  },
						body: {}
					};

					backend.reports.getAllUnfinished.and.callFake( () => Promise.resolve( unfinishedReportsResponse ) );

					await controller.index( req, res, next );

					expect( next ).toHaveBeenCalledWith( new Error( `Got ${ unfinishedReportsResponse.response.statusCode } response from backend` ) );
					expect( backend.reports.getAllUnfinished ).toHaveBeenCalledWith( req );
					expect( res.render ).not.toHaveBeenCalled();
				} );
			} );
		} );

		describe( 'With an error', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'issue with backend' );

				backend.reports.getAllUnfinished.and.callFake( () => Promise.reject( err ) );

				await controller.index( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
			} );
		} );
	} );

	describe( 'New', () => {
		it( 'Should render the reports page', () => {

			controller.new( req, res );

			expect( res.render ).toHaveBeenCalledWith( 'reports/views/new', { tasks: metadata.reportTaskList } );
		} );
	} );

	describe( 'Report', () => {
		it( 'Should render the report detail page', () => {

			const reportDetailViewModelResponse = { a: 1, b: 2 };
			req.report = { c: 3, d: 4 };

			reportDetailViewModel.and.callFake( () => reportDetailViewModelResponse );

			controller.report( req, res );

			expect( reportDetailViewModel ).toHaveBeenCalledWith( csrfToken, req.report );
			expect( res.render ).toHaveBeenCalledWith( 'reports/views/detail', reportDetailViewModelResponse );
		} );
	} );

	xdescribe( 'Start', () => {

		let ssoToken;

		beforeEach( () => {

			ssoToken = uuid();
			req.session = { ssoToken };
		} );

		it( 'Should setup the form correctly', () => {

			const statusTypesResponse = { status: 1 };
			const boolResponse = { bool: 1 };
			const report = {
				problem_status: 'report status',
				is_emergency: 'report emergency'
			};
			const sessionValues = {
				status: 'session status',
				emergency: 'session emergency'
			};

			req.session.startFormValues = sessionValues;
			req.report = report;

			validators.isMetadata.and.callFake( ( key ) => {

				if( key === 'statusTypes' ){ return statusTypesResponse; }
				if( key === 'bool' ){ return boolResponse; }
			} );

			controller.start( req, res );

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];

			expect( Form ).toHaveBeenCalled();
			expect( args[ 0 ] ).toEqual( req );

			expect( config.status ).toBeDefined();
			expect( config.status.values ).toEqual( [ sessionValues.status, report.problem_status ] );
			expect( config.status.validators[ 0 ].fn ).toEqual( statusTypesResponse );

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

					controller.start( req, res );

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

					controller.start( req, res );
					expect( req.session.startFormValues ).not.toBeDefined();
				} );
			} );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the start page with the form values', () => {

				const sessionValues = { status: 1 };

				req.session.startFormValues = sessionValues;
				req.report = { id: 1, test: 2 };

				controller.start( req, res );

				expect( form.getTemplateValues ).toHaveBeenCalledWith();
				expect( res.render ).toHaveBeenCalledWith( 'reports/views/start', getTemplateValuesResponse );
			} );
		} );
	} );

	xdescribe( 'aboutProblem', () => {

		let report;

		beforeEach( () => {

			report = {
				product: 'myProduct',
				commodity_codes: 'code 1, code 2',
				export_country: 'a country',
				problem_description: 'a description',
				barrier_title: 'barrier_title',
				barrier_awareness: 'barrier_awareness',
				barrier_awareness_other: 'barrier_awareness_other'
			};
			req.report = report;
		} );

		it( 'Should setup the form correctly', () => {

			const barrierAwarenessResponse = { barrierAwarenessResponse: true };

			validators.isMetadata.and.callFake( ( key ) => {

				if( key === 'barrierAwareness' ){ return barrierAwarenessResponse; }
			} );

			function checkForm( args ){

				const config = args[ 1 ];

				expect( Form ).toHaveBeenCalled();
				expect( args[ 0 ] ).toEqual( req );

				expect( config.item ).toBeDefined();
				expect( config.item.required ).toBeDefined();
				expect( config.item.values ).toEqual( [ report.product ] );

				expect( config.commodityCode ).toBeDefined();
				expect( config.commodityCode.values ).toEqual( [ report.commodity_codes ] );

				expect( config.country ).toBeDefined();
				expect( config.country.values ).toEqual( [ report.export_country ] );
				expect( config.country.items.length ).toEqual( metadata.countries.length + 1 );
				expect( config.country.items[ 0 ] ).toEqual( { value: '', text: 'Choose a country' } );
				expect( config.country.validators[ 0 ].fn ).toEqual( validators.isCountry );

				expect( config.description ).toBeDefined();
				expect( config.description.values ).toEqual( [ report.problem_description ] );
				expect( config.description.required ).toBeDefined();

				expect( config.barrierTitle ).toBeDefined();
				expect( config.barrierTitle.values ).toEqual( [ report.barrier_title ] );
				expect( config.barrierTitle.required ).toBeDefined();

				expect( config.barrierAwareness ).toBeDefined();
				expect( config.barrierAwareness.type ).toEqual( Form.RADIO );
				expect( config.barrierAwareness.values ).toEqual( [ report.barrier_awareness ] );
				expect( config.barrierAwareness.validators[ 0 ].fn ).toEqual( barrierAwarenessResponse );
				expect( Array.isArray( config.barrierAwareness.items ) ).toEqual( true );

				expect( config.barrierAwarenessOther ).toBeDefined();
				expect( config.barrierAwarenessOther.conditional ).toEqual( { name: 'barrierAwareness', value: '4' } );
				expect( config.barrierAwarenessOther.values ).toEqual( [ report.barrier_awareness_other ] );
			}

			// check setup twice because of the country caching
			// so coverage is 100%
			controller.aboutProblem( req, res );

			checkForm( Form.calls.argsFor( 0 ) );

			controller.aboutProblem( req, res );

			checkForm( Form.calls.argsFor( 1 ) );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the view with the viewModel', async () => {

				await controller.aboutProblem( req, res, next );

				expect( form.validate ).not.toHaveBeenCalled();
				expect( form.getTemplateValues ).toHaveBeenCalledWith();
				expect( res.render ).toHaveBeenCalledWith( 'reports/views/about-problem', getTemplateValuesResponse );
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

					await controller.aboutProblem( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( 'reports/views/about-problem', getTemplateValuesResponse );
				} );
			} );

			describe( 'When the required values are filled', () => {
				describe( 'When the response is a success', () => {

					beforeEach( () => {

						backend.reports.saveProblem.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );

						req.report = { id: 1, b: 2 };
						form.hasErrors = () => false;
					} );

					afterEach( () => {

						expect( next ).not.toHaveBeenCalled();
						expect( backend.reports.saveProblem ).toHaveBeenCalledWith( req, req.report.id, getValuesResponse );
					} );

					describe( 'When save and exit is used to submit the form', () => {
						it( 'Should redirect to the report detail page', async () => {

							const reportDetailResponse = '/reportDetail';
							urls.reports.detail.and.callFake( () => reportDetailResponse );
							form.isExit = true;

							await controller.aboutProblem( req, res, next );

							expect( urls.reports.detail ).toHaveBeenCalledWith( req.report.id );
							expect( res.redirect ).toHaveBeenCalledWith( reportDetailResponse );
						} );
					} );

					describe( 'When save and continue is used to submit the form', () => {
						it( 'Should redirect', async () => {

							const legalUrlResponse = '/legal/';
							urls.reports.legal.and.callFake( () => legalUrlResponse );

							await controller.aboutProblem( req, res, next );

							expect( urls.reports.legal ).toHaveBeenCalledWith( req.report.id );
							expect( res.redirect ).toHaveBeenCalledWith( legalUrlResponse );
						} );
					} );
				} );

				describe( 'When the response is not a success', () => {
					it( 'Should call next with an error', async () => {

						const statusCode = 500;
						form.hasErrors = () => false;
						backend.reports.saveProblem.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

						await controller.aboutProblem( req, res, next );

						expect( next ).toHaveBeenCalledWith( new Error( 'Unable to save form - got 500 from backend' ) );
					} );
				} );

				describe( 'When the request fails', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'my test' );
						form.hasErrors = () => false;
						backend.reports.saveProblem.and.callFake( () => Promise.reject( err ) );

						await controller.aboutProblem( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
					} );
				} );
			} );
		} );
	} );

	describe( 'typeCategory', () => {

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

		it( 'Should setup the form correctly', () => {

			const barrierTypeCategories = { barrierTypeCategories: 1 };
			const sessionValues = {
				category: 'GOODS',
			};

			req.session.typeCategoryValues = sessionValues;

			validators.isMetadata.and.callFake( () => barrierTypeCategories );

			controller.typeCategory( req, res );

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];

			expect( Form ).toHaveBeenCalled();
			expect( args[ 0 ] ).toEqual( req );

			expect( config.category ).toBeDefined();
			expect( config.category.values ).toEqual( [ sessionValues.category, report.barrier_type_category ] );
			expect( config.category.items.length ).toEqual( Object.entries( metadata.barrierTypeCategories ).length );
			expect( config.category.validators[ 0 ].fn ).toEqual( barrierTypeCategories );
		} );

		describe( 'When it is a POST', () => {

			beforeEach( () => {

				req.method = 'POST';
				req.body = {};
				form.isPost = true;
			} );

			describe( 'When the input values are valid', () => {

				it( 'Should save the values and redirect to the next step', () => {

					const typeUrl = 'my-url';
					const status = '123';
					const emergency = '456';

					req.body = { status, emergency };
					form.hasErrors = () => false;

					urls.reports.type.and.callFake( () => typeUrl );

					controller.typeCategory( req, res );

					expect( form.validate ).toHaveBeenCalled();
					expect( req.session.typeCategoryValues ).toEqual( getValuesResponse );
					expect( res.redirect ).toHaveBeenCalledWith( typeUrl );
				} );
			} );

			describe( 'When no input values are given', () => {

				beforeEach( () => {

					req.session.typeCategoryValues = { test: 1 };
					form.hasErrors = () => true;
				} );

				it( 'Should not save the values to the session', () => {

					controller.typeCategory( req, res );
					expect( req.session.typeCategoryValues ).not.toBeDefined();
				} );
			} );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the start page with the form values', () => {

				const sessionValues = { category: 'GOODS' };

				req.session.typeCategoryValues = sessionValues;

				controller.typeCategory( req, res );

				expect( form.getTemplateValues ).toHaveBeenCalledWith();
				expect( res.render ).toHaveBeenCalledWith( 'reports/views/type-category', getTemplateValuesResponse );
			} );
		} );
	} );

	describe( 'type', () => {

		let report;
		let templateData;

		beforeEach( () => {

			report = {
				id: 123,
				barrier_type_id: 456
			};

			req.report = report;
			req.session.typeCategoryValues = { category: 'GOODS' };

			getTemplateValuesResponse = {
				barrierType: [
					{ value: 1, text: 'barrier 1', category: 'GOODS' },
					{ value: 2, text: 'barrier 2', category: 'SERVICES' }
				]
			};

			templateData = Object.assign(
				getTemplateValuesResponse,
				{ title: metadata.barrierTypeCategories.GOODS }
			);
		} );

		it( 'Should setup the form correctly', () => {

			controller.type( req, res, next );

			expect( Form ).toHaveBeenCalled();

			const args = Form.calls.argsFor( 0 );
			const config = args[ 1 ];
			const goodsBarrierType = metadata.barrierTypes[ 0 ];

			expect( args[ 0 ] ).toEqual( req );

			expect( config.barrierType ).toBeDefined();
			expect( config.barrierType.type ).toEqual( Form.RADIO );
			expect( config.barrierType.items ).toEqual( [{
				value: goodsBarrierType.id,
				text: goodsBarrierType.title,
				category: goodsBarrierType.category
			}] );
			expect( config.barrierType.values ).toEqual( [ report.barrier_type_id ] );
			expect( config.barrierType.validators[ 0 ].fn ).toEqual( validators.isBarrierType );
		} );

		describe( 'When it is a GET', () => {
			it( 'Should render the view with the viewModel', async () => {

				await controller.type( req, res, next );

				expect( form.validate ).not.toHaveBeenCalled();
				expect( form.getTemplateValues ).toHaveBeenCalledWith();
				expect( res.render ).toHaveBeenCalledWith( 'reports/views/type', templateData );
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

					await controller.type( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( 'reports/views/type', templateData );
				} );
			} );

			describe( 'When the required values are filled', () => {
				describe( 'When the response is a success', () => {

					beforeEach( () => {

						backend.reports.saveBarrierType.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );

						req.report = { id: 1, b: 2 };
						form.hasErrors = () => false;
					} );

					afterEach( () => {

						expect( next ).not.toHaveBeenCalled();
						expect( req.session.typeCategoryValues ).not.toBeDefined();
						expect( backend.reports.saveBarrierType ).toHaveBeenCalledWith( req, req.report.id, getValuesResponse );
					} );

					describe( 'When save and exit is used to submit the form', () => {
						it( 'Should redirect to the report detail page', async () => {

							const reportDetailResponse = '/reportDetail';
							urls.reports.detail.and.callFake( () => reportDetailResponse );
							form.isExit = true;

							await controller.type( req, res, next );

							expect( urls.reports.detail ).toHaveBeenCalledWith( req.report.id );
							expect( res.redirect ).toHaveBeenCalledWith( reportDetailResponse );
						} );
					} );

					describe( 'When save and continue is used to submit the form', () => {
						it( 'Should redirect', async () => {

							const detailResponse = '/detail/';
							urls.reports.detail.and.callFake( () => detailResponse );

							await controller.type( req, res, next );

							expect( urls.reports.detail ).toHaveBeenCalledWith( req.report.id );
							expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
						} );
					} );
				} );

				describe( 'When the response is not a success', () => {
					it( 'Should call next with an error', async () => {

						const statusCode = 500;
						form.hasErrors = () => false;
						backend.reports.saveBarrierType.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

						await controller.type( req, res, next );

						expect( next ).toHaveBeenCalledWith( new Error( 'Unable to save form - got 500 from backend' ) );
					} );
				} );

				describe( 'When the request fails', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'my test' );
						form.hasErrors = () => false;
						backend.reports.saveBarrierType.and.callFake( () => Promise.reject( err ) );

						await controller.type( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
					} );
				} );
			} );
		} );
	} );

	describe( 'submitReport', () => {

		beforeEach( () => {

			req.report = { id: 1, b: 2 };
		} );

		describe( 'When the response is a success', () => {

			beforeEach( () => {

				backend.reports.submit.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );

				form.hasErrors = () => false;
			} );

			afterEach( () => {

				expect( next ).not.toHaveBeenCalled();
				expect( backend.reports.submit ).toHaveBeenCalledWith( req, req.report.id );
			} );

			it( 'Should render the submitted page', async () => {

				const successUrlResponse = '/a-url';

				urls.reports.success.and.callFake( () => successUrlResponse );

				await controller.submit( req, res, next );

				expect( res.redirect ).toHaveBeenCalledWith( successUrlResponse );
			} );
		} );

		describe( 'When the response is not a success', () => {
			it( 'Should call next with an error', async () => {

				const statusCode = 500;
				const reportDetailResponse = '/reportDetail';
				urls.reports.detail.and.callFake( () => reportDetailResponse );
				form.hasErrors = () => false;
				backend.reports.submit.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

				await controller.submit( req, res, next );

				expect( urls.reports.detail ).toHaveBeenCalledWith( req.report.id );
				expect( res.redirect ).toHaveBeenCalledWith( reportDetailResponse );
			} );
		} );

		describe( 'When the request fails', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'my test' );
				form.hasErrors = () => false;
				backend.reports.submit.and.callFake( () => Promise.reject( err ) );

				await controller.submit( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
			} );
		} );
	} );

	describe( 'success', () => {
		it( 'Should render the success page', () => {

			controller.success( req, res );

			expect( res.render ).toHaveBeenCalledWith( 'reports/views/success' );
		} );
	} );
} );
