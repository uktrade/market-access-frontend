const proxyquire = require( 'proxyquire' );
const modulePath = './vcap-services';

const redisUrl = 'rediss://x:PASSWORD@clustercfg.cf-u7zpvbwzxmrvu.p9lva7.euw1.cache.amazonaws.com:6379';

const validJson = `{
	"redis": [
		{
		"binding_name": null,
		"credentials": {
			"host": "clustercfg.cf-u7zpvbwzxmrvu.p9lva7.euw1.cache.amazonaws.com",
			"name": "cf-u7zpvbwzxmrvu",
			"password": "PASSWORD",
			"port": 6379,
			"tls_enabled": true,
			"uri": "${ redisUrl }"
		},
		"instance_name": "my-redis-service",
		"label": "redis",
		"name": "my-redis-service",
		"plan": "tiny-clustered-3.2",
		"provider": null,
		"syslog_drain_url": null,
		"tags": [
			"elasticache",
			"redis"
		],
		"volume_mounts": []
		}
	]
}`;

describe( 'vcap-services', () => {

	let vcap;
	let logger;

	beforeEach( () => {

		logger = jasmine.helpers.mockLogger.create();
		vcap = proxyquire( modulePath, {
			'./logger': logger
		} );
	} );

	describe( 'parseRedis', () => {
		describe( 'With undefined', () => {
			it( 'Should return undefined', () => {

				expect( vcap.parseRedis() ).toEqual( undefined );
				expect( logger.error ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'With an valid JSON string', () => {
			it( 'Should return the redis uri', () => {

				expect( vcap.parseRedis( validJson ) ).toEqual( redisUrl );
			} );
		} );

		describe( 'With invalid JSON', () => {
			it( 'Should return undefined', () => {

				expect( vcap.parseRedis( 'abc' ) ).toEqual( undefined );
				expect( logger.error ).toHaveBeenCalled();
			} );
		} );
	} );
} );
