const errorForName = require( '../../../../../app/lib/nunjucks-filters/error-for-name' );

describe( 'Error for name filter', () => {
	describe( 'When the list is an array', () => {
		describe( 'When the name exists', () => {
			it( 'Should return the item', () => {

				const name = 'test';
				const errors = [ { href: ( '#' + name ), text: 'testing' } ];

				const item = errorForName( errors, name );

				expect( item ).toBeDefined();
				expect( item.href ).toEqual( '#' + name );
			} );
		} );

		describe( 'When the name does not exist', () => {
			it( 'Should return undefined', () => {

				const item = errorForName( [ { href: '#test' } ], 'invalidname' );

				expect( item ).not.toBeDefined();
			} );
		} );
	} );

	describe( 'When the list is a string', () => {
		it( 'Should return undefined', () => {

			const item = errorForName( '', 'test' );

			expect( item ).not.toBeDefined();
		} );
	} );
} );
