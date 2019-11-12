const highlight = require( './highlight' );

describe( 'Highlight filter', () => {
	describe( 'When the input is a string', () => {
		describe( 'When there is a single match', () => {
			describe( 'When it is all lowercase', () => {
				it( 'Should wrap the match', () => {

					expect( highlight( 'this is a matching string', 'matching' ) ).toEqual( 'this is a <span class="highlight">matching</span> string' );
				} );
			} );

			describe( 'When it is capital case', () => {
				it( 'Should wrap the match', () => {

					expect( highlight( 'this is a Matching string', 'matching' ) ).toEqual( 'this is a <span class="highlight">Matching</span> string' );
					expect( highlight( 'Testbirds Ltd', 'testbirds' ) ).toEqual( '<span class="highlight">Testbirds</span> Ltd' );
				} );
			} );

			describe( 'When it is a partial match', () => {
				it( 'Should wrap the match', () => {

					expect( highlight( 'this is a Matching string', 'match' ) ).toEqual( 'this is a <span class="highlight">Match</span>ing string' );
				} );
			} );

			describe( 'When the match is a number', () => {
				it( 'Should wrap the match', () => {

					expect( highlight( 'my string 1', 1 ) ).toEqual( 'my string <span class="highlight">1</span>' );
				} );
			} );

			describe( 'When there is a regex character in the string', () => {
				it( 'Should wrap the match', () => {

					expect( highlight( 'my string 1[test', '1[test' ) ).toEqual( 'my string <span class="highlight">1[test</span>' );
				} );
			} );
		} );

		describe( 'When there is a double match', () => {
			it( 'Should wrap both matches', () => {

				expect( highlight( 'this is a matching string with two matching examples', 'matching' ) ).toEqual( 'this is a <span class="highlight">matching</span> string with two <span class="highlight">matching</span> examples' );
			} );
		} );

		describe( 'When the string is empty', () => {
			it( 'Should return the string', () => {

				expect( highlight( 'a string with no matches', '' ) ).toEqual( 'a string with no matches' );
			} );
		} );
	} );

	describe( 'When the input is not a string', () => {
		it( 'Should return the input', () => {

			expect( highlight( [ 1, 2 ] ) ).toEqual( [ 1, 2 ] );
		} );
	} );
} );
