const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const faker = require( 'faker' );

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

	describe( 'list', () => {

		const template = 'barriers/views/companies/list';
		let companies;

		function createCompanies(){

			return [
				{ id: uuid(), name: faker.lorem.words() },
				{ id: uuid(), name: faker.lorem.words() },
				{ id: uuid(), name: faker.lorem.words() },
			];
		}

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
					const err = new Error( `Unable to save companies for barrier, got ${ statusCode } response code` );

					backend.barriers.saveCompanies.and.callFake( () => Promise.resolve( { response: {
						isSuccess: false,
						statusCode
					} } ) );

					await controller.list( req, res, next );

					expect( next ).toHaveBeenCalledWith( err );
					expect( res.render ).not.toHaveBeenCalled();
				} );
			} );
		} );
	} );
} );
