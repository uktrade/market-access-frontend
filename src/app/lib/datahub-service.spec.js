const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = './datahub-service';

describe( 'Datahub Service', () => {

	let service;
	let req;

	beforeEach( () => {

		req = { session: { ssoToken: uuid() } };
	} );

	describe( 'In stub mode', () => {

		let datahubStub;

		beforeEach( () => {

			datahubStub = {
				get: jasmine.createSpy( 'datahubStub.get' ),
				post: jasmine.createSpy( 'datahubStub.post' )
			};

			service = proxyquire( modulePath, {
				'../config': { datahub: { stub: true } },
				'./datahub-request.stub': datahubStub
			} );
		} );

		describe( 'getCompany', () => {
			it( 'Should call the correct path', () => {

				const id = '123-456';

				service.getCompany( req, id );

				expect( datahubStub.get ).toHaveBeenCalledWith( `/v3/company/${ id }`, req.session.ssoToken );
			} );
		} );

		describe( 'searchCompany', () => {
			describe( 'With just a company name', () => {
				it( 'Should call the correct path', () => {

					const name = 'test-name';

					service.searchCompany( req, name );

					expect( datahubStub.post ).toHaveBeenCalledWith( `/v3/search/company`, req.session.ssoToken, {
						name,
						offset: 0,
						limit: 20
					} );
				} );
			} );
		} );
	} );

	describe( 'In prod mode', () => {

		let datahub;

		beforeEach( () => {

			datahub = {
				get: jasmine.createSpy( 'datahub.get' ),
				post: jasmine.createSpy( 'datahub.post' )
			};

			service = proxyquire( modulePath, {
				'../config': { datahub: { stub: false } },
				'./datahub-request': datahub
			} );
		} );

		describe( 'getCompany', () => {
			it( 'Should call the correct path', () => {

				const id = '123-456';

				service.getCompany( req, id );

				expect( datahub.get ).toHaveBeenCalledWith( `/v3/company/${ id }`, req.session.ssoToken );
			} );
		} );

		describe( 'searchCompany', () => {
			describe( 'With just a company name', () => {
				it( 'Should call the correct path', () => {

					const name = 'test-name';

					service.searchCompany( req, name );

					expect( datahub.post ).toHaveBeenCalledWith( `/v3/search/company`, req.session.ssoToken, {
						name,
						offset: 0,
						limit: 20
					} );
				} );
			} );
		} );

		describe( 'getContact', () => {
			it( 'Should call the correct path', () => {

				const id = '123-456';

				service.getContact( req, id );

				expect( datahub.get ).toHaveBeenCalledWith( `/v3/contact/${ encodeURIComponent( id ) }`, req.session.ssoToken );
			} );
		} );
	} );
} );
