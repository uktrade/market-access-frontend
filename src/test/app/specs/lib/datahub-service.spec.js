const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = '../../../../app/lib/datahub-service';

describe( 'Datahub Service', () => {

	let datahub;
	let service;
	let req;

	beforeEach( () => {

		datahub = {
			get: jasmine.createSpy( 'datahub.get' ),
			post: jasmine.createSpy( 'datahub.post' )
		};

		service = proxyquire( modulePath, {
			'./datahub-request': datahub
		} );

		req = { session: { ssoToken: uuid() } };
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
/*
				expect( datahub.post ).toHaveBeenCalledWith( `/v3/search/company?offset=0&limit=20`, req.session.ssoToken, {
					original_query: name,
					//uk_based: isUkBased,
					isAggregation: false
				} );
*/
				expect( datahub.post ).toHaveBeenCalledWith( `/v3/search/company`, req.session.ssoToken, {
					name,
					offset: 0,
					limit: 20
				} );
			} );
		} );
	} );
} );
