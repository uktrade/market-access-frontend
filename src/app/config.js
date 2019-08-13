/* eslint no-console: 0 */
const os = require( 'os' );
const vcap = require( './lib/vcap-services' );
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
const isCi = bool( 'CI', false );
const vcapRedisUrl = vcap.parseRedis( env( 'VCAP_SERVICES' ) );
const logLevel = env( 'LOG_LEVEL', 'warn' );

let config = {
	isDev,
	isCi,
	logLevel,
	isDebug: ( logLevel === 'debug' ),
	environment: {
		banner: bool( 'ENV_BANNER', false ),
		name: env( 'ENV_NAME' ),
	},
	showErrors: isDev,
	addCompany: bool( 'ADD_COMPANY', false ),
	version: env( 'npm_package_version', 'unknown' ),
	sentryDsn: env( 'SENTRY_DSN' ),
	analytics: {
		id: env( 'ANALYTICS_ID' ),
		enabled: bool( 'ANALYTICS_ENABLED', true )
	},
	feedbackEmail: requiredEnv( 'FEEDBACK_EMAIL' ),
	datahubDomain: env( 'DATA_HUB_DOMAIN', 'https://www.datahub.trade.gov.uk' ),
	views: {
		cache: bool( 'CACHE_VIEWS', true )
	},
	reports: {
		summaryLimit: number( 'REPORT_SUMMARY_LIMIT', 300 ),
	},
	watchList: {
		maxLists: number( 'MAX_WATCH_LISTS', 3 ),
		maxNameLength: number( 'MAX_WATCH_LIST_NAME_LENGTH', 25 ),
	},
	files: {
		maxSize: number( 'FILE_MAX_SIZE', ( 5 * 1024 * 1024 ) ),
		types: env( 'FILE_TYPES', 'image/jpeg,text/csv' ).split( ',' ),
		s3: {
			encryption: {
				header: env( 'FILE_S3_ENCRYPTION_HEADER', 'x-amz-server-side-encryption' ),
				value: env( 'FILE_S3_ENCRYPTION_VALUE', 'AES256' ),
			},
		},
		scan: {
			maxWaitTime: number( 'FILE_SCAN_MAX_WAIT_TIME', 30000 ),
			statusCheckInterval: number( 'FILE_SCAN_STATUS_CHECK_INTERVAL', 500 ),
		},
	},
	backend: {
		url: requiredEnv( 'BACKEND_URL' ),
		hawk: {
			enabled: bool( 'BACKEND_HAWK_ENABLED', true ),
			id: requiredEnv( 'BACKEND_HAWK_ID' ),
			key: requiredEnv( 'BACKEND_HAWK_KEY' ),
		}
	},
	datahub: {
		url: requiredEnv( 'DATAHUB_URL' ),
		hawk: {
			id: requiredEnv( 'DATAHUB_HAWK_ID' ),
			key: requiredEnv( 'DATAHUB_HAWK_KEY' ),
		},
		stub: bool( 'DATAHUB_STUB' )
	},
	server: {
		secure: !( isDev || isCi ),
		host: env( 'SERVER_HOST', 'localhost' ),
		port: number( 'SERVER_PORT', number( 'PORT', 8080 ) ),
		cpus,
		workers: number( 'SERVER_WORKERS', number( 'WEB_CONCURRENCY', cpus ) )
	},
	redis: {
		host: env( 'REDIS_HOST' ),
		port: number( 'REDIS_PORT' ),
		password: env( 'REDIS_PASSWORD' ),
		url: ( vcapRedisUrl || env( 'REDIS_URL', env( 'REDISTOGO_URL' ) ) ),
		tls: bool( 'REDIS_USE_TLS', true )
	},
	session: {
		ttl: number( 'SESSION_TTL', ( 1000 * 60 * 60 * 2 ) ),//milliseconds for cookie
		secret: requiredEnv( 'SESSION_SECRET' )
	},
	sso: {
		bypass: bool( 'SSO_BYPASS' ),
		protocol: env( 'SSO_PROTOCOL', 'https' ),
		domain: requiredEnv( 'SSO_DOMAIN' ),
		port: number( 'SSO_PORT', 443 ),
		client: requiredEnv( 'SSO_CLIENT' ),
		secret: requiredEnv( 'SSO_SECRET' ),
		mockCode: env( 'SSO_MOCK_CODE' ),
		api: {
			token: requiredEnv( 'SSO_API_TOKEN' ),
		},
		path: {
			auth: requiredEnv( 'SSO_PATH_AUTH' ),
			token: requiredEnv( 'SSO_PATH_TOKEN' ),
			introspect: requiredEnv( 'SSO_PATH_INTROSPECT' ),
			user: env( 'SSO_PATH_USER' )
		},
		redirectUri: requiredEnv( 'SSO_REDIRECT_URI' ),
		paramLength: number( 'OAUTH_PARAM_LENGTH', 75 )
	},
};

checkRequiredEnvs();

module.exports = config;
