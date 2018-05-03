/* eslint no-console: 0 */
const os = require( 'os' );
const requiredEnvs = [];

function env( name, defaultValue ){

	var exists = ( typeof process.env[ name ] !== 'undefined' );

	return ( exists ? process.env[ name ] : defaultValue );
}

function requiredEnv( name, defaultValue ){

	requiredEnvs.push( name );

	return env( name, defaultValue );
}

function bool( name, defaultValue ){

	return ( env( name, defaultValue ) + '' ) === 'true';
}

function number( name, defaultValue ){

	return parseInt( env( name, defaultValue ), 10 );
}

function checkRequiredEnvs(){

	const missing = [];

	for( let name of requiredEnvs ){

		if( typeof process.env[ name ] === 'undefined' ){

			missing.push( name );
		}
	}

	if( missing.length ){

		console.log( 'Missing required env variables:', missing );
		throw new Error( 'Missing required env variables' );
	}
}

const cpus = ( os.cpus().length || 1 );
const isDev = ( ( process.env.NODE_ENV || 'development' ) === 'development' );

let config = {
	isDev,
	showErrors: isDev,
	version: env( 'npm_package_version', 'unknown' ),
	logLevel: env( 'LOG_LEVEL', 'warn' ),
	sentryDsn: env( 'SENTRY_DSN' ),
	analyticsId: env( 'ANALYTICS_ID' ),
	datahubDomain: env( 'DATA_HUB_DOMAIN', 'https://www.datahub.trade.gov.uk' ),
	views: {
		cache: bool( 'CACHE_VIEWS', true )
	},
	server: {
		host: env( 'SERVER_HOST', 'localhost' ),
		port: number( 'SERVER_PORT', number( 'PORT', 8080 ) ),
		cpus,
		workers: number( 'SERVER_WORKERS', number( 'WEB_CONCURRENCY', cpus ) )
	}
};

checkRequiredEnvs();

module.exports = config;
