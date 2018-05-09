const proxyquire = require( 'proxyquire' );

const modulePath = '../../../../app/lib/redis-client';

let redis;
let redisClient;

let client;

function createClient( redisConfig ){

	client = proxyquire( modulePath, {
		'redis': redis,
		'../config': {
			redis: redisConfig || {}
		}
	} ).get();
}

describe( 'Redis Client', function(){

	beforeEach( function(){

		redisClient = {
			on: jasmine.createSpy( 'redis.client.on' )
		};

		redis = {
			createClient: jasmine.createSpy( 'redis.createClient' ).and.callFake( () => redisClient )
		};
	} );

	it( 'Should listen for the events', function(){

		const calls = redisClient.on.calls;

		createClient();

		expect( calls.count() ).toEqual( 4 );

		expect( calls.argsFor( 0 )[ 0 ] ).toEqual( 'error' );
		expect( calls.argsFor( 1 )[ 0 ] ).toEqual( 'connect' );
		expect( calls.argsFor( 2 )[ 0 ] ).toEqual( 'ready' );
		expect( calls.argsFor( 3 )[ 0 ] ).toEqual( 'close' );
	} );

	it( 'Should return the client', function(){

		createClient();
		expect( client ).toEqual( redisClient );
	} );

	describe( 'With redis.host specified in the config', function(){

		it( 'Should pass it as an option ', function(){

			createClient( {	host: 'beep' } );
			expect( redis.createClient ).toHaveBeenCalledWith( { host: 'beep' } );
		} );
	} );

	describe( 'With redis.port specified in the config', function(){

		it( 'Should pass it as an option ', function(){

			createClient( {	port: 'boop' } );
			expect( redis.createClient ).toHaveBeenCalledWith( { port: 'boop' } );
		} );
	} );

	describe( 'With redis.password specified in the config', function(){

		it( 'Should pass it as an option ', function(){

			createClient( {	password: 'beep' } );
			expect( redis.createClient ).toHaveBeenCalledWith( { password: 'beep' } );
		} );
	} );

	describe( 'With redis.url specified in the config', function(){

		it( 'Should pass it as an option ', function(){

			createClient( {	url: 'redis://redistogo:44ec0bc04dd4a5afe77a649acee7a8f3@drum.redistogo.com:9092/' } );
			expect( redis.createClient ).toHaveBeenCalledWith( { url: 'redis://redistogo:44ec0bc04dd4a5afe77a649acee7a8f3@drum.redistogo.com:9092/' } );
		} );
	} );
} );