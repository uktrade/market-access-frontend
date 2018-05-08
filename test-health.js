/* eslint no-console: 0 */
const http = require( 'http' );

const requestOptions = {
	hostname: 'localhost',
	port: ( process.env.SERVER_PORT || 8080 ),
	path: '/ping/',
	method: 'GET'
};

const req = http.request( requestOptions, ( res ) => {

	const statusCode = res.statusCode;
	
	if( statusCode === 200 ){

		process.exit( 0 );

	} else {

		console.log( `Invalid response code: ${ statusCode }` );
		process.exit( 2 );
	}
} );

req.on( 'error', ( e ) => {

	console.log( 'Error with request:' );
	console.log( e );
	process.exit( 1 );
} );

req.end();
