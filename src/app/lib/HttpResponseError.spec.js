const HttpResponseError = require( './HttpResponseError' );

describe( 'HttpResponseError', () => {
	it( 'Extends the Error class', () => {

		const err = new HttpResponseError( 'test', {} );

		expect( err instanceof Error ).toEqual( true );
	} );

	it( 'Cretes the correct message and adds the response info', () => {

		const statusCode = 400;
		const headers = { some: 'header' };
		const body = 'My body content';
		const message  = 'Some message';
		const err = new HttpResponseError( message, { statusCode, headers }, body );

		expect( err.message ).toEqual( `${ message }. Received ${ statusCode } response code` );
		expect( err.response ).toEqual( {
			statusCode,
			headers,
			body,
		} );
	} );
} );
