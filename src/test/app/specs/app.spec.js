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
	let stubs;

	beforeEach( function(){

		stubs = {
			'morgan': function(){ return function ( req, res, next ){ next(); }; }
		};

		logger.remove( winston.transports.Console );
		oldTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
		jasmine.DEFAULT_TIMEOUT_INTERVAL = 500;
	} );

	afterEach( function(){
		logger.add( winston.transports.Console );
		jasmine.DEFAULT_TIMEOUT_INTERVAL = oldTimeout;
	} );

	describe( 'Pages', function(){

		beforeEach( function(){

			stubs[ './config' ] = {
				isDev: true
			};
			app = proxyquire( modulePath, stubs ).create();
		} );

		describe( 'index page', function(){

			it( 'Should render the index page', function( done ){

				supertest( app ).get( '/' ).end( ( err, res ) => {

					checkResponse( res, 200 );
					expect( getTitle( res ) ).toEqual( 'Department for International Trade' );
					done();
				} );
			} );
		} );

		describe( '404 page', function(){

			it( 'Should render the 404 page', function( done ){

				supertest( app ).get( '/abc123' ).end( ( err, res ) => {

					checkResponse( res, 404 );
					expect( getTitle( res ) ).toEqual( 'Department for International Trade - Not found' );
					done();
				} );
			} );
		} );

		describe( 'Ping', function(){

			it( 'Should return a status of 200', function( done ){

				supertest( app ).get( '/ping/' ).end( ( err, res ) => {

					checkResponse( res, 200 );
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

		beforeEach( function(){

			morgan = jasmine.createSpy( 'morgan' );
			disable = jasmine.createSpy( 'app.disable' );
			compression = jasmine.createSpy( 'compression' );

			express = function(){
				return {
					disable,
					use: jasmine.createSpy( 'app.use' ),
					set: jasmine.createSpy( 'app.set' ),
					get: jasmine.createSpy( 'app.get' ),
					post: jasmine.createSpy( 'app.post' ),
				};
			};
		} );

		describe( 'Dev mode', function(){

			it( 'Should setup the app in dev mode', function(){

				const app = proxyquire( modulePath, {
					'./config': { isDev: true },
					'morgan': morgan,
					'compression': compression,
					'express': express
				} );

				app.create();

				expect( morgan ).toHaveBeenCalledWith( 'dev' );
				expect( compression ).not.toHaveBeenCalled();
				expect( disable ).toHaveBeenCalledWith( 'x-powered-by' );
			} );
		} );

		describe( 'Prod mode', function(){

			it( 'Should setup the app in prod mode', function(){

				const app = proxyquire( modulePath, {
					'./config': { isDev: false },
					'morgan': morgan,
					'compression': compression,
					'express': express
				} );

				app.create();

				expect( morgan ).toHaveBeenCalledWith( 'combined' );
				expect( compression ).toHaveBeenCalled();
				expect( disable ).toHaveBeenCalledWith( 'x-powered-by' );
			} );
		} );
	} );
} );
