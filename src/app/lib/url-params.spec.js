const urlParams = require( './url-params' );

describe( 'urlParams', () => {
	it( 'Should convert an object to parms for a url', () => {

		expect( urlParams( { a: 'test', b: 'test2&' } ) ).toEqual( 'a=test&b=test2%26' );
	} );
} );
