const logger = require( './logger' );
module.exports = {

	parseRedis: function( json ){

		if( json ){

			try {

				const config = JSON.parse( json );
				return config.redis[ 0 ].credentials.uri;

			} catch( e ){

				logger.error( e );
			}
		}
	}
};
