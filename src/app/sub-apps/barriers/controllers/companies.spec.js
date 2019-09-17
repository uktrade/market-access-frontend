const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const faker = require( 'faker' );
const HttpResponseError = require( '../../../lib/HttpResponseError' );

const modulePath = './companies';

describe( 'Barrier companies controller', () => {

	let controller;
	let req;
	let res;
	let next;
	let backend;
	let datahub;
	let urls;
	let csrfToken;
	let Form;
	let form;
	let getValuesResponse;
	let getTemplateValuesResponse;
	let barrierId;
	let companies;

	beforeEach( () => {

		csrfToken = uuid();
		barrierId = uuid();
		companies = undefined;

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
				saveCompanies: jasmine.createSpy( 'backend.barriers.saveCompanies' ),
			}
		};
		datahub = {
			searchCompany: jasmine.createSpy( 'datahub.searchCompany' ),
		};

		urls = {
			index: jasmine.createSpy( 'urls.index' ),
			barriers: {
				detail: jasmine.createSpy( 'urls.barriers.detail' ),
				companies: {
					list: jasmine.createSpy( 'urls.barriers.companies.list' )
				}
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
		controller = proxyquire( modulePath, {
			'../../../lib/backend-service': backend,
			'../../../lib/datahub-service': datahub,
			'../../../lib/urls': urls,
			'../../../lib/Form': Form,
		} );
	} );

	function createCompanies(){

		return [
			{ id: uuid(), name: faker.lorem.words() },
			{ id: uuid(), name: faker.lorem.words() },
			{ id: uuid(), name: faker.lorem.words() },
		];
	}

	describe( 'list', () => {

		const template = 'barriers/views/companies/list';

		describe( 'a GET request', () => {
			describe( 'With companies in the session', () => {
				it( 'Should render the templste', async () => {

					companies = createCompanies();

					req.session.barrierCompanies = companies;

					await controller.list( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( template, {
						csrfToken,
						companyList: companies
					} );
				} );
			} );

			describe( 'With companies on the barrier', () => {
				it( 'Should render the template', async () => {

					companies = createCompanies();

					req.barrier.companies = companies;

					await controller.list( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( template, {
						csrfToken,
						companyList: companies
					} );
				} );
			} );

			describe( 'With no companies', () => {
				it( 'Should render the template', async () => {

					await controller.list( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( template, {
						csrfToken,
						companyList: []
					} );
				} );
			} );
		} );

		describe( 'a POST request', () => {

			beforeEach( () => {

				companies = createCompanies();
				req.method = 'POST';
				req.session.barrierCompanies = companies;
			} );

			describe( 'When the service throws an error', () => {
				it( 'Should call next with the error', async () => {

					const err = new Error( 'A fail' );

					backend.barriers.saveCompanies.and.callFake( () => { throw err;  }  );

					await controller.list( req, res, next );

					expect( next ).toHaveBeenCalledWith( err );
					expect( res.render ).not.toHaveBeenCalled();
					expect( req.session.barrierCompanies ).not.toBeDefined();
				} );
			} );

			describe( 'When the service returns a success response', () => {
				it( 'Should redirect to the barrier detail page', async () => {

					const detailResponse = '/a/barrier';

					urls.barriers.detail.and.callFake( () => detailResponse );
					backend.barriers.saveCompanies.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );

					await controller.list( req, res, next );

					expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
					expect( res.render ).not.toHaveBeenCalled();
				} );
			} );

			describe( 'When the service does not return a success', () => {
				it( 'Should call next with an error', async () => {

					const statusCode = 500;

					backend.barriers.saveCompanies.and.callFake( () => Promise.resolve( { response: {
						isSuccess: false,
						statusCode
					} } ) );

					await controller.list( req, res, next );

					expect( next ).toHaveBeenCalled();
					expect( next.calls.argsFor( 0 )[ 0 ] instanceof HttpResponseError ).toEqual( true );
					expect( res.render ).not.toHaveBeenCalled();
				} );
			} );
		} );
	} );

	describe( 'edit', () => {

		const template = 'barriers/views/companies/list';

		describe( 'a GET request', () => {
			describe( 'With companies in the session', () => {
				it( 'Should overwrite the session companies and render the template', async () => {

					companies = createCompanies();

					req.session.barrierCompanies = createCompanies();
					req.barrier.companies = companies;

					await controller.edit( req, res, next );

					expect( req.session.barrierCompanies ).toEqual( companies );
					expect( res.render ).toHaveBeenCalledWith( template, {
						csrfToken,
						companyList: companies
					} );
				} );
			} );

			describe( 'With companies on the barrier', () => {
				it( 'Should put the companies in the session and render the template', async () => {

					companies = createCompanies();

					req.barrier.companies = companies;

					await controller.edit( req, res, next );

					expect( req.session.barrierCompanies ).toEqual( companies );
					expect( res.render ).toHaveBeenCalledWith( template, {
						csrfToken,
						companyList: companies
					} );
				} );
			} );

			describe( 'With no companies', () => {
				it( 'Should create an empty array and render the template', async () => {

					await controller.edit( req, res, next );

					expect( req.session.barrierCompanies ).toEqual( [] );
					expect( res.render ).toHaveBeenCalledWith( template, {
						csrfToken,
						companyList: []
					} );
				} );
			} );
		} );
	} );

	describe( 'new', () => {

		const template = 'barriers/views/companies/search';

		afterEach( () => {

			const templateValues = {
				...getTemplateValuesResponse,
				companies: [],
				results: undefined,
				error: undefined,
			};

			expect( req.session.barrierCompanies ).toEqual( [] );
			expect( res.render ).toHaveBeenCalledWith( template, templateValues );
		} );

		describe( 'a GET request', () => {
			it( 'Should setup the form correctly', async () => {

				await controller.new( req, res, next );

				const config = Form.calls.argsFor( 0 )[ 1 ];

				expect( config.query ).toBeDefined();
				expect( config.query.required ).toBeDefined();
			} );

			describe( 'With companies in the session', () => {
				it( 'Should remove the session companies and render the template', async () => {

					req.session.barrierCompanies = createCompanies();

					await controller.new( req, res, next );
				} );
			} );

			describe( 'With no companies in the session', () => {
				it( 'Should render the template', async () => {

					req.session.barrierCompanies = [];

					await controller.new( req, res, next );
				} );
			} );

			describe( 'With no session', () => {
				it( 'Should create an empty array and render the template', async () => {

					await controller.new( req, res, next );
				} );
			} );
		} );
	} );

	describe( 'search', () => {

		const template = 'barriers/views/companies/search';
		let results;
		let error;

		function getTemplateValues(){

			return Object.assign( {}, getTemplateValuesResponse, { companies, results, error } );
		}

		beforeEach( () => {

			results = undefined;
			error = undefined;
		} );

		describe( 'a GET', () => {
			it( 'Should setup the form correctly', async () => {

				await controller.search( req, res, next );

				const config = Form.calls.argsFor( 0 )[ 1 ];

				expect( config.query ).toBeDefined();
				expect( config.query.required ).toBeDefined();
			} );

			describe( 'With companies in the session', () => {
				it( 'Should render the template', async () => {

					companies = createCompanies();
					req.session.barrierCompanies = companies;
					const templateValues = getTemplateValues();

					await controller.search( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( template, templateValues );
				} );
			} );

			describe( 'With companies on the barrier', () => {
				it( 'Should render the template', async () => {

					companies = createCompanies();
					req.barrier.companies = companies;
					const templateValues = getTemplateValues();

					await controller.search( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( template, templateValues );
				} );
			} );
		} );

		describe( 'a POST', () => {

			beforeEach( () => {

				form.isPost = true;
			} );

			describe( 'When the form has errors', () => {
				it( 'Should render the template', async () => {

					const templateValues = getTemplateValues();

					form.hasErrors = () => true;

					await controller.search( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( template, templateValues );
					expect( datahub.searchCompany ).not.toHaveBeenCalled();
				} );
			} );

			describe( 'When the form does not have errors', () => {

				beforeEach( () => {

					form.hasErrors = () => false;
				} );

				describe( 'When the service throws an error', () => {
					it( 'Should call next with an error', async () => {

						const err = new Error( 'a service error' );

						datahub.searchCompany.and.callFake( () => { throw err; } );

						await controller.search( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
						expect( res.render ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'When the service returns a success', () => {
					it( 'Should render the template with the results', async () => {

						results = [ { id: 1, name: 'one' } ];

						const templateValues = getTemplateValues();

						datahub.searchCompany.and.callFake( () => Promise.resolve( {
							response: { isSuccess: true },
							body: results
						} ));

						await controller.search( req, res, next );

						expect( res.render ).toHaveBeenCalledWith( template, templateValues );
					} );
				} );

				describe( 'When the service does not return a success', () => {

					async function check( statusCode, errorMessage ){

						error = errorMessage;

						const templateValues = getTemplateValues();

						datahub.searchCompany.and.callFake( () => Promise.resolve( {
							response: { isSuccess: false, statusCode }
						} ) );

						await controller.search( req, res, next );

						expect( res.render ).toHaveBeenCalledWith( template, templateValues );
					}

					describe( 'When it retuns a 400', () => { // the POST body is invalid for the company search endpoint
						it( 'Should render the template with an error', async () => {

							await check( 400, 'There was an error finding the company' );
						} );
					} );

					describe( 'When it returns a 401', () => { // there was a problem with the credentials (IP or Hawk header)
						it( 'Should render the template with an error', async () => {

							await check( 401, 'There was an error finding the company' );
						} );
					} );

					describe( 'When it retuns a 403', () => {
						it( 'Should render the template with an error', async () => {

							await check( 403, 'There was an error finding the company' );
						} );
					} );

					describe( 'When it retuns a 404', () => {
						it( 'Should render the template with an error', async () => {

							await check( 404, 'No company found' );
						} );
					} );

					describe( 'When it retuns a 500', () => {
						it( 'Should render the template with an error', async () => {

							await check( 500, 'There was an error finding the company' );
						} );
					} );
				} );
			} );
		} );
	} );

	describe( 'details', () => {
		describe( 'a GET', () => {
			it( 'Should render the template', async () => {

				await controller.details( req, res );

				expect( res.render ).toHaveBeenCalledWith( 'barriers/views/companies/details', { csrfToken } );
			} );
		} );

		describe( 'a POST', () => {

			beforeEach( () => {

				req.method = 'POST';
			} );

			describe( 'With companies in the session', () => {

				let company;
				const listResponse = '/company/list';

				beforeEach( () => {

					companies = createCompanies();
					req.session.barrierCompanies = companies;

					company = {
						id: uuid(),
						name: faker.lorem.words()
					};
					req.company = company;

					urls.barriers.companies.list.and.callFake( () => listResponse );
				} );

				describe( 'When the POSTed company is NOT in the session', () => {
					it( 'Should add the company to the list', () => {

						const expected = companies.concat( [ company ] );

						controller.details( req, res );

						expect( req.session.barrierCompanies ).toEqual( expected );
						expect( res.redirect ).toHaveBeenCalledWith( listResponse );
						expect( res.render ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'When the POSTed company is in the session', () => {
					it( 'Should NOT add the company to the list', () => {

						companies.push( company );

						const expected = companies.slice( 0 );

						controller.details( req, res );

						expect( req.session.barrierCompanies ).toEqual( expected );
						expect( res.redirect ).toHaveBeenCalledWith( listResponse );
						expect( res.render ).not.toHaveBeenCalled();
					} );
				} );
			} );
		} );
	} );

	describe( 'remove', () => {
		it( 'Should remove the company and redirect', () => {

			const companies = createCompanies();
			const companyId = companies[ 1 ].id;
			const expected = [ companies[ 0 ], companies[ 2 ] ];
			const listResponse = '/list/company/';

			req.body = { companyId };
			req.session.barrierCompanies = companies;
			urls.barriers.companies.list.and.callFake( () => listResponse );

			controller.remove( req, res );

			expect( req.session.barrierCompanies ).toEqual( expected );
			expect( res.redirect ).toHaveBeenCalledWith( listResponse );
		} );
	} );
} );
