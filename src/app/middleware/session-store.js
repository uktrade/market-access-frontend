const session = require( 'express-session' );
const connectRedis = require( 'connect-redis' );
const config = require( '../config' );
const redisClient = require( '../lib/redis-client' );

module.exports = {
	create: () => {

		const RedisStore = connectRedis( session );

		return session( {
			store: new RedisStore( {
				client: redisClient.get(),
				// config ttl defined in milliseconds for cookie
				ttl: ( config.session.ttl / 1000 ),
				secret: config.session.secret
			} ),
			proxy: !config.isDev, //prod uses a proxy and we need to trust it to set cookies
			cookie: {
				secure: !config.isDev,
				maxAge: config.session.ttl,
			},
			rolling: true,
			secret: config.session.secret,
			resave: true,
			saveUninitialized: false,
			unset: 'destroy'
		} );
	}
};