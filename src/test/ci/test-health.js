/* eslint no-console: 0 */
const EndpointCheck = require( './helpers/EndpointCheck' );

const host = 'localhost';
const port = ( process.env.SERVER_PORT || 8080 );
const path = '/ping/';

const appUrl = `http://${ host }:${ port }${ path }`;

new EndpointCheck( appUrl, ( err ) => {

	if( err ){

		console.log( 'Could not connect to app:' );
		console.log( err );
		process.exit( 1 );

	} else {

		process.exit();
	}
} );
