if( process.env.HAS_DATAHUB_STUBS == 'true' ){

	console.log( 'Have stubs, running extra tests' );

} else {

	return;
}

const getStub = require( '../../helpers/get-stub' );
const stub = require( '../../../../app/lib/datahub-request.stub' );

describe( 'Datahub request stub', () => {
	describe( 'get', () => {
		describe( 'company details', () => {
			it( 'Should match and return the stub', async () => {

				const data = await stub.get( '/v3/company/abc-123' );
				expect( data.body ).toEqual( getStub( '/datahub/company/details' ) );
				expect( data.response.isSuccess ).toEqual( true );
			} );
		} );
	} );

	describe( 'post', () => {
		describe( 'company search', () => {
			it( 'Should match and return a stub', async () => {

				const data = await stub.post( '/v3/search/company' );
				expect( data.body ).toEqual( getStub( '/datahub/search/company' ) );
				expect( data.response.isSuccess ).toEqual( true );
			} );
		} );
	} );
} );
