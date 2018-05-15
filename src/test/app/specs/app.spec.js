const supertest = require( 'supertest' );
const proxyquire = require( 'proxyquire' );
const winston = require( 'winston' );

const logger = require( '../../../app/lib/logger' );
const modulePath = '../../../app/app';

function getTitle( res ){

	const text = res.text;
	const openTag = '<title>';
	const openTagIndex = text.indexOf( openTag );
	const closeTagIndex = text.indexOf( '</title>', openTagIndex );
	const title = text.substring( ( openTagIndex + openTag.length ), closeTagIndex );

	return title;
}

function checkResponse( res, statusCode ){

	const headers = res.headers;

	expect( res.statusCode ).toEqual( statusCode );
	expect( headers[ 'x-download-options' ] ).toBeDefined();
	expect( headers[ 'x-xss-protection' ] ).toBeDefined();
	expect( headers[ 'x-content-type-options' ] ).toBeDefined();
	expect( headers[ 'x-frame-options' ] ).toBeDefined();
	expect( headers[ 'cache-control' ] ).toEqual( 'no-cache, no-store' );
}

describe( 'App', function(){

	let app;
	let oldTimeout;

	beforeAll( function(){

		logger.remove( winston.transports.Console );
		oldTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
		jasmine.DEFAULT_TIMEOUT_INTERVAL = 500;
	} );

	afterAll( function(){

		logger.add( winston.transports.Console );
		jasmine.DEFAULT_TIMEOUT_INTERVAL = oldTimeout;
	} );

	describe( 'Pages', function(){

		beforeAll( function(){

			app = supertest( proxyquire( modulePath, {
				'morgan': function(){ return function ( req, res, next ){ next(); }; },
				'./config': {
					isDev: true
				}
			} ).create() );
		} );

		describe( 'index page', function(){

			it( 'Should render the index page', function( done ){

				app.get( '/' ).end( ( err, res ) => {

					checkResponse( res, 200 );
					expect( getTitle( res ) ).toEqual( 'Market Access :: Homepage' );
					done();
				} );
			} );
		} );

		describe( '404 page', function(){

			it( 'Should render the 404 page', function( done ){

				app.get( '/abc123' ).end( ( err, res ) => {

					checkResponse( res, 404 );
					expect( getTitle( res ) ).toEqual( 'Department for International Trade - Not found' );
					done();
				} );
			} );
		} );

		describe( 'Ping', function(){

			it( 'Should return a status of 200', function( done ){

				app.get( '/ping/' ).end( ( err, res ) => {

					checkResponse( res, 200 );
					done();
				} );
			} );
		} );

		describe( 'Login', () => {
		
			it( 'Should redirect to the sso page', ( done ) => {
		
				app.get( '/login/' ).end( ( err, res ) => {

					checkResponse( res, 302 );
					expect( res.headers.location ).toBeDefined();
					done();
				} );
			} );
		} );

		describe( 'Login callback', () => {
		
			it( 'Should redirect to the login page', ( done ) => {
		
				app.get( '/login/callback/' ).end( ( err, res ) => {

					checkResponse( res, 302 );
					done();
				} );
			} );
		} );
	} );

	describe( 'Environments', function(){

		let morgan;
		let disable;
		let compression;
		let express;
		let use;
		let ssoBypass;
		let auth;

		beforeEach( function(){

			morgan = jasmine.createSpy( 'morgan' );
			compression = jasmine.createSpy( 'compression' );
			disable = jasmine.createSpy( 'app.disable' );
			use = jasmine.createSpy( 'app.use' );
			ssoBypass = jasmine.createSpy( 'sso-bypass' );
			auth = jasmine.createSpy( 'auth' );

			express = function(){
				return {
					disable,
					use,
					set: jasmine.createSpy( 'app.set' ),
					get: jasmine.createSpy( 'app.get' ),
					post: jasmine.createSpy( 'app.post' ),
				};
			};
		} );

		function usesMiddleware( fn ){

			const l = use.calls.count();
			let i = 0;

			for( ; i < l; i++ ){

				if( use.calls.argsFor( i )[ 0 ] == fn ){

					return true;
				}
			}

			return false;
		}

		describe( 'Dev mode', function(){

			it( 'Should setup the app in dev mode', function(){

				const app = proxyquire( modulePath, {
					'./config': { isDev: true },
					'morgan': morgan,
					'compression': compression,
					'express': express,
					'./middleware/sso-bypass': ssoBypass,
					'./middleware/auth': auth
				} );

				app.create();

				expect( morgan ).toHaveBeenCalledWith( 'dev' );
				expect( compression ).not.toHaveBeenCalled();
				expect( disable ).toHaveBeenCalledWith( 'x-powered-by' );
				expect( usesMiddleware( ssoBypass ) ).toEqual( true );
				expect( usesMiddleware( auth ) ).toEqual( true );
			} );
		} );

		describe( 'Prod mode', function(){

			it( 'Should setup the app in prod mode', function(){

				const app = proxyquire( modulePath, {
					'./config': { isDev: false },
					'morgan': morgan,
					'compression': compression,
					'express': express,
					'./middleware/auth': auth
				} );

				app.create();

				expect( morgan ).toHaveBeenCalledWith( 'combined' );
				expect( compression ).toHaveBeenCalled();
				expect( disable ).toHaveBeenCalledWith( 'x-powered-by' );
				expect( usesMiddleware( ssoBypass ) ).toEqual( false );
				expect( usesMiddleware( auth ) ).toEqual( true );
			} );
		} );
	} );
} );
