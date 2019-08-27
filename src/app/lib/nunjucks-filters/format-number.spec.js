const formatNumber = require( './format-number' );

describe( 'Format number filter', () => {
	describe( 'When there is no value input', () => {
		it( 'Should return the input', () => {

			expect( formatNumber() ).toEqual();
			expect( formatNumber( '' ) ).toEqual( '' );
		} );
	} );

	describe( 'When there is a number', () => {
		it( 'Should format it correctly', () => {

			const values = [
				[ '0', '0' ],
				[ '100', '100' ],
				[ '1000', '1,000' ],
				[ '20000', '20,000' ],
				[ '300000', '300,000' ],
				[ '4000000', '4,000,000' ],
			];

			for( const [ input, output ] of values ){

				expect( formatNumber( input ) ).toEqual( output );
			}
		} );
	} );
} );
