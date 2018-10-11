/* eslint no-console: 0 */
const config = require( './test-config' );
const EndpointCheck = require( './helpers/EndpointCheck' );

const appUrl = `${ config.baseUrl }/ping/`;

new EndpointCheck( appUrl, ( err ) => {

	if( err ){

		console.log( 'Could not connect to app:' );
		console.log( err );
		process.exit( 1 );

	} else {

		process.exit();
	}
} );
