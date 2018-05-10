const urls = require( '../../../../app/lib/urls' );

describe( 'URLs', () => {

	describe( 'Login', () => {
	
		it( 'Should return the login path', () => {
	
			expect( urls.login() ).toEqual( '/login/' );
		} );
	} );
} );
