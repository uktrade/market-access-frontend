const removeEmpty = require( './remove-empty' );

describe( 'Remove empty', () => {
	describe( 'When the input is an array', () => {
		describe( 'When there are not any empty items', () => {
			describe( 'When they are all strings', () => {
				it( 'Should return the same values', () => {

					expect( removeEmpty( [ 'a', 'b', 'c' ] ) ).toEqual( [ 'a', 'b', 'c' ] );
				} );
			} );

			describe( 'When it is a mix of numbers and strings', () => {
				it( 'Should return the same values', () => {

					expect( removeEmpty( [ 'a', 0, 'c' ] ) ).toEqual( [ 'a', 0, 'c' ] );
				} );
			} );
		} );

		describe( 'When there are some empty items', () => {
			describe( 'When it is empty strings', () => {
				it( 'Should return only the non empty values', () => {

					expect( removeEmpty( [ 'a', '', 'c', 'd', '' ] ) ).toEqual( [ 'a', 'c', 'd' ] );
				} );
			} );

			describe( 'When it is single spaces', () => {
				it( 'Should return only the non empty values', () => {

					expect( removeEmpty( [ 'a', ' ', 'c', 'd', ' ' ] ) ).toEqual( [ 'a', 'c', 'd' ] );
				} );
			} );

			describe( 'When it is double spaces', () => {
				it( 'Should return only the non empty values', () => {

					expect( removeEmpty( [ 'a', '  ', 'c', 'd', '  ' ] ) ).toEqual( [ 'a', 'c', 'd' ] );
				} );
			} );

			describe( 'When it is null', () => {
				it( 'Should return only the non empty values', () => {

					expect( removeEmpty( [ "1 A Road", null, "Paris", null, "75001", "France" ] ) ).toEqual( [ "1 A Road",  "Paris",  "75001", "France" ] );
				} );
			} );
		} );
	} );

	describe( 'When the input is not a string', () => {
		it( 'Should return the input', () => {

			expect( removeEmpty( { a: 'test' } ) ).toEqual( { a: 'test' } );
			expect( removeEmpty( 'my-string' ) ).toEqual( 'my-string' );
			expect( removeEmpty( 3 ) ).toEqual( 3 );
		} );
	} );
} );
