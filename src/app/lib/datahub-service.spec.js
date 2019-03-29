const proxyquire = require( 'proxyquire' );
const modulePath = './datahub-service';

describe( 'Datahub Service', () => {

	let service;

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

				service.getCompany( id );

				expect( datahubStub.get ).toHaveBeenCalledWith( `/v4/public/company/${ id }` );
			} );
		} );

		describe( 'searchCompany', () => {
			describe( 'With just a company name', () => {
				it( 'Should call the correct path', () => {

					const name = 'test-name';

					service.searchCompany( name );

					expect( datahubStub.post ).toHaveBeenCalledWith( `/v4/public/search/company`, {
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

				service.getCompany( id );

				expect( datahub.get ).toHaveBeenCalledWith( `/v4/public/company/${ id }` );
			} );
		} );

		describe( 'searchCompany', () => {
			describe( 'With just a company name', () => {
				it( 'Should call the correct path', () => {

					const name = 'test-name';

					service.searchCompany( name );

					expect( datahub.post ).toHaveBeenCalledWith( `/v4/public/search/company`, {
						name,
						offset: 0,
						limit: 20
					} );
				} );
			} );
		} );
	} );
} );
