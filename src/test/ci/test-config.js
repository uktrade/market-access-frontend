const path = require( 'path' );
const appConfig = require( '../../app/config' );

function env( name, defaultValue ){

	var exists = ( typeof process.env[ name ] !== 'undefined' );

	return ( exists ? process.env[ name ] : defaultValue );
}

const host = env( 'TEST_HOST', appConfig.server.host );
const port = appConfig.server.port;
const seleniumServer = env( 'SELENIUM_SERVER', 'localhost' );
const seleniumServerPort = env( 'SELENIUM_SERVER_PORT', '4444' );

module.exports = {

	host,
	port,
	seleniumServer,
	seleniumServerPort,
	browser: env( 'TEST_BROWSER', 'safari' ),
	baseUrl: `http://${ host }:${ port }`,
	seleniumServerUrl: `http://${ seleniumServer }:${ seleniumServerPort }/wd/hub`,
	screenshotDir: path.resolve( __dirname, 'output/screenshots' ),
	accessibilityReportDir: path.resolve( __dirname, 'output/accessibility-reports' ),
	backendUrl: appConfig.backend.href
};
