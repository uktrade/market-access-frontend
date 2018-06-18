const proxyquire = require( 'proxyquire' );
const mockLogger = require( '../../helpers/mock-logger' );

const modulePath = '../../../../app/lib/redis-client';

let redis;
let redisClient;
let logger;

let client;

function createClient( redisConfig ){

	logger = mockLogger.create();

	client = proxyquire( modulePath, {
		'redis': redis,
		'./logger': logger,
		'../config': {
			redis: redisConfig || {}
		}
	} ).get();
}

function getEventHandler( event ){

	const l = redisClient.on.calls.count();
	let i = 0;
	let args;

	for( ; i < l; i++ ){

		args = redisClient.on.calls.argsFor( i );

		if( args[ 0 ] === event ){

			return args[ 1 ];
		}
	}
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
		it( 'Should pass it as an option', function(){

			createClient( { host: 'beep' } );
			expect( redis.createClient ).toHaveBeenCalledWith( { host: 'beep' } );
		} );
	} );

	describe( 'With redis.port specified in the config', function(){
		it( 'Should pass it as an option', function(){

			createClient( { port: 'boop' } );
			expect( redis.createClient ).toHaveBeenCalledWith( { port: 'boop' } );
		} );
	} );

	describe( 'With redis.password specified in the config', function(){
		it( 'Should pass it as an option', function(){

			createClient( { password: 'beep' } );
			expect( redis.createClient ).toHaveBeenCalledWith( { password: 'beep' } );
		} );
	} );

	describe( 'With redis.url specified in the config', function(){
		it( 'Should pass it as an option', function(){

			createClient( { url: 'redis://redistogo:44ec0bc04dd4a5afe77a649acee7a8f3@drum.redistogo.com:9092/' } );
			expect( redis.createClient ).toHaveBeenCalledWith( { url: 'redis://redistogo:44ec0bc04dd4a5afe77a649acee7a8f3@drum.redistogo.com:9092/' } );
		} );
	} );

	describe( 'When tls is set to true in the config', () => {
		it( 'SHould pass set rejectUnauthorized to true', () => {

			createClient( { tls: true } );
			expect( redis.createClient ).toHaveBeenCalledWith( { tls: { rejectUnauthorized: true } } );
		} );
	} );

	describe( 'When the client errors', () => {
		it( 'Should log the error and throw it', () => {

			createClient();
			const handler = getEventHandler( 'error' );
			const err = new Error( 'Test client error' );

			expect( () => {

				handler( err );

			} ).toThrow( err );

			expect( logger.error.calls.argsFor( 0 )[ 0 ] ).toEqual( 'Error connecting to redis' );
			expect( logger.error.calls.argsFor( 1 )[ 0 ] ).toEqual( err );
		} );
	} );

	describe( 'When the client connects', () => {
		it( 'Should log the event', () => {

			createClient();
			const handler = getEventHandler( 'connect' );
			handler();

			expect( logger.info.calls.argsFor( 0 )[ 0 ] ).toEqual( 'Connected to redis' );
		} );
	} );

	describe( 'When the client is ready', () => {
		it( 'Should log the event', () => {

			createClient();
			const handler = getEventHandler( 'ready' );
			handler();

			expect( logger.info.calls.argsFor( 0 )[ 0 ] ).toEqual( 'Connection to redis is ready to use' );
		} );
	} );

	describe( 'When the client is closed', () => {
		it( 'Should log the event', () => {

			createClient();
			const handler = getEventHandler( 'close' );
			handler();

			expect( logger.info.calls.argsFor( 0 )[ 0 ] ).toEqual( 'Connection to redis has closed' );
		} );
	} );
} );
