const getDateParts = require( './get-date-parts' );

describe( 'getDateParts', () => {
	describe( 'With undefined', () => {
		it( 'Should return undefined', () => {

			expect( getDateParts() ).toEqual();
		} );
	} );

	describe( 'With a string', () => {
		it( 'Should return the parts', () => {

			expect( getDateParts( '2018-02-01' ) ).toEqual( { day: '01', month: '02', year: '2018' } );
		} );
	} );
} );
