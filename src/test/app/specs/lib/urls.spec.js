const urls = require( '../../../../app/lib/urls' );

describe( 'URLs', () => {

	describe( 'Login', () => {
	
		it( 'Should return the login path', () => {
	
			expect( urls.login() ).toEqual( '/login/' );
		} );
	} );

	describe( 'Index', () => {
	
		it( 'Should return the correct path', () => {
	
			expect( urls.index() ).toEqual( '/' );
		} );
	} );

	describe( 'Report a barrier', () => {
	
		describe( 'index', () => {
		
			it( 'Should return the correct path', () => {
		
				expect( urls.report.index() ).toEqual( '/report/' );
			} );
		} );
	} );
} );
