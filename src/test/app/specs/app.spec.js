const supertest = require( 'supertest' );
const proxyquire = require( 'proxyquire' );
const winston = require( 'winston' );
const nock = require( 'nock' );

const urls = require( '../../../app/lib/urls' );
const logger = require( '../../../app/lib/logger' );
const modulePath = '../../../app/app';

const intercept = require( '../helpers/intercept' );
const getCsrfToken = require( '../helpers/get-csrf-token' );

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

	if( res.statusCode != statusCode ){
		console.log( res.text );
	}

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
	let appModule;

	beforeAll( function(){

		logger.remove( winston.transports.Console );
		oldTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
		jasmine.DEFAULT_TIMEOUT_INTERVAL = 3000;

		intercept.backend()
			.persist()
			.get( '/whoami/' )
			.reply( 200, {} );
	} );

	afterAll( function(){

		logger.add( winston.transports.Console );
		jasmine.DEFAULT_TIMEOUT_INTERVAL = oldTimeout;
	} );

	describe( 'Pages', function(){

		beforeAll( async () => {

			intercept.backend()
				.persist()
				.get( '/metadata/' )
				.reply( 200, intercept.stub( '/backend/metadata/' ) );

			appModule =  proxyquire( modulePath, {
				'morgan': () => ( req, res, next ) => next(),
				'./config': {
					isDev: true
				}
			} );

			app = supertest( await appModule.create() );
		} );

		describe( 'index page', function(){
			it( 'Should render the index page', function( done ){

				intercept.backend()
					.get( '/barriers/' )
					.reply( 200, intercept.stub( '/backend/barriers/' ) );

				app.get( urls.index() ).end( ( err, res ) => {

					checkResponse( res, 200 );
					expect( getTitle( res ) ).toEqual( 'Market Access - Homepage' );
					done();
				} );
			} );
		} );

		describe( 'Report a barrier', () => {
			describe( 'Index page', () => {
				it( 'Should render the index page', ( done ) => {

					app.get( urls.report.index() ).end( ( err, res ) => {

						checkResponse( res, 200 );
						expect( getTitle( res ) ).toEqual( 'Market Access - Report a barrier' );
						done();
					} );
				} );
			} );

			describe( 'Start page', () => {
				describe( 'Without a barrierId', () => {
					it( 'Should render the start page', ( done ) => {

						app.get( urls.report.start() ).end( ( err, res ) => {

							checkResponse( res, 200 );
							expect( getTitle( res ) ).toEqual( 'Market Access - Report - Status of the problem' );
							done();
						} );
					} );
				} );

				describe( 'With a barrierId', () => {
					it( 'Should fetch the barrier and render the start page', ( done ) => {

						const barrierId = '1';

						intercept.backend()
							.get( `/barriers/${ barrierId }/` )
							.reply( 200, intercept.stub( '/backend/barriers/barrier' ) );

						app.get( urls.report.start( barrierId ) ).end( ( err, res ) => {

							checkResponse( res, 200 );
							expect( getTitle( res ) ).toEqual( 'Market Access - Report - Status of the problem' );
							done();
						} );
					} );
				} );
			} );

			describe( 'Company search page', () => {

				let agent;
				let token;

				beforeAll( async () => {

					agent = supertest.agent( await appModule.create() );
				} );

				it( 'Should get the form and save the token', ( done ) => {

					agent.get( urls.report.start() )
						.end( ( err, res ) => {

							token = getCsrfToken( res, done.fail );
							done();
						} );
				} );

				it( 'Should save the status values', ( done ) => {

					agent.post( urls.report.start() )
						.send( `_csrf=${ token }&status=1&emergency=2` )
						.expect( 302, done );
				} );

				it( 'Should render the company search page', ( done ) => {

					agent.get( urls.report.companySearch() ).end( ( err, res ) => {

						checkResponse( res, 200 );
						expect( getTitle( res ) ).toEqual( 'Market Access - Report - Search for company' );
						done();
					} );
				} );
			} );

			describe( 'Company detail', () => {

				let companyId;
				let agent;

				beforeEach( async ( done ) => {

					companyId = 'd829a9c6-cffb-4d6a-953b-3e02a2b33028';

					agent = supertest.agent( await appModule.create() );

					agent.get( urls.report.start() )
						.end( ( err, res ) => {

							const token = getCsrfToken( res, done.fail );

							agent.post( urls.report.start() )
								.send( `_csrf=${ token }&status=1&emergency=2` )
								.expect( 302, done );
						} );
				} );

				afterEach( () => {

					const isDone = nock.isDone();

					expect( isDone ).toEqual( true );

					if( !isDone ){
						console.log( nock.pendingMocks() );
					}
				} );

				describe( 'With a success', () => {
					it( 'Should render the details of a company', ( done ) => {

						intercept.datahub()
							.get( `/v3/company/${ companyId }` )
							.reply( 200, intercept.stub( '/datahub/company/detail' ) );

						agent.get( urls.report.companyDetails( companyId ) )
							.end( ( err, res ) => {

							checkResponse( res, 200 );
							expect( getTitle( res ) ).toEqual( 'Market Access - Report - Company details' );
							done();
						} );
					} );
				} );

				describe( 'With an error', () => {
					it( 'Should render the error page', ( done ) => {

						intercept.datahub()
							.get( `/v3/company/${ companyId }` )
							.reply( 500, {} );

						app.get( urls.report.companyDetails( companyId ) )
							.end( ( err, res ) => {

							checkResponse( res, 500 );
							expect( getTitle( res ) ).toEqual( 'Market Access - Error' );
							done();
						} );
					} );
				} );
			} );

			describe( 'Company contacts', () => {

				let companyId;
				let agent;

				beforeEach( async ( done ) => {

					companyId = 'd829a9c6-cffb-4d6a-953b-3e02a2b33028';

					intercept.datahub()
						.get( `/v3/company/${ companyId }` )
						.reply( 200, intercept.stub( '/datahub/company/detail' ) );

					agent = supertest.agent( await appModule.create() );

					agent.get( urls.report.start() )
						.end( ( err, res ) => {

							if( err ){ return done.fail( err ); }

							const token = getCsrfToken( res, done.fail );

							agent.post( urls.report.start() )
								.send( `_csrf=${ token }&status=1&emergency=2` )
								.expect( 302 )
								.end( ( err ) => {

									if( err ){ return done.fail( err ); }

									agent.get( urls.report.companyDetails( companyId ) )
										.expect( 200 )
										.end( ( err, res ) => {

											if( err ){ return done.fail( err ); }

											const token = getCsrfToken( res, done.fail );

											agent.post( urls.report.companySearch() )
												.send( `_csrf=${ token }&companyId=${ companyId }` )
												.expect( 302, done );
										} );
								} );
						} );
				} );

				afterEach( () => {

					expect( nock.isDone() ).toEqual( true );
				} );

				it( 'Should render the contacts page', ( done ) => {

					intercept.datahub()
						.get( `/v3/company/${ companyId }` )
						.reply( 200, intercept.stub( '/datahub/company/detail' ) );

					agent.get( urls.report.contacts( companyId ) )
							.end( ( err, res ) => {

							checkResponse( res, 200 );
							expect( getTitle( res ) ).toEqual( 'Market Access - Report - Company contacts' );
							done();
						} );
				} );
			} );
		} );

		describe( '404 page', function(){
			it( 'Should render the 404 page', function( done ){

				app.get( '/abc123' ).end( ( err, res ) => {

					checkResponse( res, 404 );
					expect( getTitle( res ) ).toEqual( 'Market Access - Not found' );
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

				app.get( urls.login() ).end( ( err, res ) => {

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
					param: jasmine.createSpy( 'app.param' )
				};
			};

			intercept.backend()
				.get( '/metadata/' )
				.reply( 200, intercept.stub( '/backend/metadata/' ) );
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

		describe( 'Dev mode', () => {
			it( 'Should setup the app in dev mode', async () => {

				const app = proxyquire( modulePath, {
					'./config': { isDev: true },
					'morgan': morgan,
					'compression': compression,
					'express': express,
					'./middleware/sso-bypass': ssoBypass,
					'./middleware/auth': auth
				} );

				await app.create();

				expect( morgan ).toHaveBeenCalledWith( 'dev' );
				expect( compression ).not.toHaveBeenCalled();
				expect( disable ).toHaveBeenCalledWith( 'x-powered-by' );
				expect( usesMiddleware( ssoBypass ) ).toEqual( true );
				expect( usesMiddleware( auth ) ).toEqual( true );
			} );
		} );

		describe( 'Prod mode', () => {
			it( 'Should setup the app in prod mode', async () => {

				const app = proxyquire( modulePath, {
					'./config': { isDev: false },
					'morgan': morgan,
					'compression': compression,
					'express': express,
					'./middleware/auth': auth
				} );

				await app.create();

				expect( morgan ).toHaveBeenCalledWith( 'combined' );
				expect( compression ).toHaveBeenCalled();
				expect( disable ).toHaveBeenCalledWith( 'x-powered-by' );
				expect( usesMiddleware( ssoBypass ) ).toEqual( false );
				expect( usesMiddleware( auth ) ).toEqual( true );
			} );
		} );
	} );
} );
