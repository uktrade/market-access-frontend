const filter = require( './file-size' );

describe( 'File size filter', () => {
	it( 'Should return the correct text', () => {

		const args = [
			[ 1, '1 Byte' ],
			[ 10, '10 Bytes' ],
			[ 1024, '1 kB' ],
			[ 2 * 1024 * 1024 , '2 MB' ],
			[ 2.1 * 1024 * 1024 , '2.1 MB' ],
			[ 5 * 1024 * 1024, '5 MB' ],
			[ 50 * 1024 * 1024, '50 MB' ],
			[ 100 * 1024 * 1024, '100 MB' ],
			[ 200 * 1024 * 1024, '200 MB' ],
			[ 250 * 1024 * 1024, '250 MB' ],
			[ 251 * 1024 * 1024, '251 MB' ],
			[ 1024 * 1024 * 1024, '1 GB' ],
			[ 1100 * 1024 * 1024, '1.1 GB' ],
			[ 10 * 1024 * 1024 * 1024, '10 GB' ],
		];

		for( let [ input, output ] of args ){

			expect( filter( input ) ).toEqual( output );
		}
	} );
} );
