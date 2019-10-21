const proxyquire = require( 'proxyquire' );
const modulePath = './redis-check';
const TEMPLATE = 'error/redis-lost';

describe( 'redis-check middleware', () => {

	let req;
	let res;
	let next;
	let middleware;
	let redisClient;

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

	beforeEach( () => {

		({ req, res, next } = jasmine.helpers.mocks.middleware());
		redisClient = {
			on: jasmine.createSpy( 'redis.client.on' )
		};

		middleware = proxyquire( modulePath, {
			'../lib/redis-client': {
				get: () => redisClient,
			},
		} );
	} );

	describe( 'The default state', () => {
		it( 'Renders the redis lost error', () => {
			middleware( req, res, next );

			expect( res.render ).toHaveBeenCalledWith( TEMPLATE );
		} );
	} );

	describe( 'When the redis client fires a ready event', () => {
		it( 'Calls next', () => {

			getEventHandler( 'ready' )();

			middleware( req, res, next );

			expect( next ).toHaveBeenCalledWith();
			expect( res.render ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'When the redis client fires an error event', () => {
		it( 'Calls next', () => {

			getEventHandler( 'error' )();

			middleware( req, res, next );

			expect( next ).not.toHaveBeenCalled();
			expect( res.render ).toHaveBeenCalledWith( TEMPLATE );
		} );
	} );
} );
