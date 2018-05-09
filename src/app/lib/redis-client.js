const redis = require( 'redis' );

const config = require( '../config' );
const logger = require( './logger' );

const options = {};

for( let name of [ 'host', 'port', 'password', 'url' ] ){

	if( typeof config.redis[ name ] !== 'undefined' ){

		options[ name ] = config.redis[ name ];
	}
}

if( config.redis.tls ){

	options.tls = { rejectUnauthorized: !!config.redis.tls };
}

let client;

module.exports = {

	get: () => {

		if( !client ){

			client = redis.createClient( options );

			client.on( 'error', ( e ) => {
				logger.error( 'Error connecting to redis' );
				logger.error( e );
				throw e;
			} );

			client.on( 'connect', () => {
				logger.info( 'Connected to redis' );
			} );

			client.on( 'ready', () => {
				logger.info( 'Connection to redis is ready to use' );
			} );

			client.on( 'close', () => {
				logger.info( 'Connection to redis has closed' );
			} );
		}

		return client;
	}
};