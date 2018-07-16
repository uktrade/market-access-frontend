const supertest = require( 'supertest' );
const proxyquire = require( 'proxyquire' );
const winston = require( 'winston' );
const nock = require( 'nock' );

const urls = require( './lib/urls' );
const logger = require( './lib/logger' );
const modulePath = './app';

const intercept = jasmine.helpers.intercept;
const getCsrfToken = jasmine.helpers.getCsrfToken;

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

function checkPage( title, done, responseCode = 200 ){

	return ( err, res ) => {

		if( err ){ return done.fail( err ); }

		checkResponse( res, responseCode );
		expect( getTitle( res ) ).toEqual( title );
		done();
	};
}

function checkNock(){

	const isDone = nock.isDone();

	expect( isDone ).toEqual( true );

	if( !isDone ){
		console.log( nock.pendingMocks() );
	}
}

function interceptReport( reportId ){

	intercept.backend()
		.get( `/reports/${ reportId }/` )
		.reply( 200, intercept.stub( '/backend/reports/report' ) );
}

describe( 'App', function(){

	let app;
	let oldTimeout;

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

		let appInstance;

		beforeAll( async () => {

			intercept.backend()
				.persist()
				.get( '/metadata/' )
				.reply( 200, intercept.stub( '/backend/metadata/' ) );

			const appModule =  proxyquire( modulePath, {
				'morgan': () => ( req, res, next ) => next(),
				'./config': {
					isDev: true
				}
			} );

			appInstance = await appModule.create();

			app = supertest( appInstance );
		} );

		describe( 'index page', function(){
			it( 'Should render the index page', function( done ){

				intercept.backend()
					.get( '/reports/' )
					.reply( 200, intercept.stub( '/backend/reports/' ) );

				app
					.get( urls.index() )
					.end( checkPage( 'Market Access - Homepage', done ) );
			} );
		} );

		describe( 'Report a barrier', () => {
			describe( 'Index page', () => {
				it( 'Should render the index page', ( done ) => {

					app
						.get( urls.report.index() )
						.end( checkPage( 'Market Access - Report a barrier', done ) );
				} );
			} );

			describe( 'Start page', () => {

				const title = 'Market Access - Report - Status of the problem';

				describe( 'Without a reportId', () => {
					it( 'Should render the start page', ( done ) => {

						app
							.get( urls.report.start() )
							.end( checkPage( title, done ) );
					} );
				} );

				describe( 'With a reportId', () => {
					it( 'Should fetch the report and render the start page', ( done ) => {

						const reportId = '1';

						intercept.backend()
							.get( `/reports/${ reportId }/` )
							.reply( 200, intercept.stub( '/backend/reports/report' ) );

						app
							.get( urls.report.start( reportId ) )
							.end( checkPage( title, done ) );
					} );
				} );
			} );

			describe( 'Company search page', () => {

				let agent;

				beforeAll( async ( done ) => {

					agent = supertest.agent( appInstance );

					agent
						.get( urls.report.start() )
						.end( ( err, res ) => {

							const token = getCsrfToken( res, done.fail );

							agent
								.post( urls.report.start() )
								.send( `_csrf=${ token }&status=1&emergency=true` )
								.expect( 302, done );
						} );
				} );

				describe( 'Without a report id', () => {
					it( 'Should render the company search page', ( done ) => {

						agent
							.get( urls.report.companySearch() )
							.end( checkPage( 'Market Access - Report - Search for company', done ) );
					} );
				} );

				describe( 'With a report id', () => {

					afterEach( checkNock );

					it( 'Should fetch the report and render the company search page', ( done ) => {

						const reportId = '1234';

						interceptReport( reportId );

						agent
							.get( urls.report.companySearch( reportId ) )
							.end( checkPage( 'Market Access - Report - Search for company', done ) );
					} );
				} );
			} );

			describe( 'Company details', () => {

				let companyId;
				let agent;

				beforeEach( ( done ) => {

					companyId = 'd829a9c6-cffb-4d6a-953b-3e02a2b33028';

					agent = supertest.agent( appInstance );

					agent
						.get( urls.report.start() )
						.end( ( err, res ) => {

							const token = getCsrfToken( res, done.fail );

							agent
								.post( urls.report.start() )
								.send( `_csrf=${ token }&status=1&emergency=false` )
								.expect( 302, done );
						} );
				} );

				afterEach( checkNock );

				describe( 'With a success', () => {

					const title = 'Market Access - Report - Company details';

					beforeEach( () => {

						intercept.datahub()
							.get( `/v3/company/${ companyId }` )
							.reply( 200, intercept.stub( '/datahub/company/detail' ) );
					} );

					describe( 'Without a report id', () => {
						it( 'Should render the details of a company', ( done ) => {

							agent
								.get( urls.report.companyDetails( companyId ) )
								.end( checkPage( title, done ) );
						} );
					} );

					describe( 'With a report id', () => {
						it( 'Should fetch the report and render the details of a company', ( done ) => {

							const reportId = '789';

							interceptReport( reportId );

							agent
								.get( urls.report.companyDetails( companyId, reportId ) )
								.end( checkPage( title, done ) );
						} );
					} );
				} );

				describe( 'With an error', () => {
					it( 'Should render the error page', ( done ) => {

						intercept.datahub()
							.get( `/v3/company/${ companyId }` )
							.reply( 500, {} );

						app
							.get( urls.report.companyDetails( companyId ) )
							.end( checkPage( 'Market Access - Error', done, 500 ) );
					} );
				} );
			} );

			describe( 'Company contacts', () => {

				let companyId;
				let agent;

				beforeEach( ( done ) => {

					companyId = 'd829a9c6-cffb-4d6a-953b-3e02a2b33028';

					intercept.datahub()
						.get( `/v3/company/${ companyId }` )
						.reply( 200, intercept.stub( '/datahub/company/detail' ) );

					agent = supertest.agent( appInstance );

					agent
						.get( urls.report.start() )
						.end( ( err, res ) => {

							if( err ){ return done.fail( err ); }

							const token = getCsrfToken( res, done.fail );

							agent
								.post( urls.report.start() )
								.send( `_csrf=${ token }&status=1&emergency=false` )
								.expect( 302 )
								.end( ( err ) => {

									if( err ){ return done.fail( err ); }

									agent
										.get( urls.report.companyDetails( companyId ) )
										.expect( 200 )
										.end( ( err, res ) => {

											if( err ){ return done.fail( err ); }

											const token = getCsrfToken( res, done.fail );

											agent
												.post( urls.report.companySearch() )
												.send( `_csrf=${ token }&companyId=${ companyId }` )
												.expect( 302, done );
										} );
								} );
						} );
				} );

				afterEach( checkNock );

				it( 'Should render the contacts page', ( done ) => {

					intercept.datahub()
						.get( `/v3/company/${ companyId }` )
						.reply( 200, intercept.stub( '/datahub/company/detail' ) );

					agent
						.get( urls.report.contacts( companyId ) )
						.end( checkPage( 'Market Access - Report - Company contacts', done ) );
				} );

				describe( 'Viewing a contact', () => {

					const contactId = 'abc-123';
					const title = 'Market Access - Report - Contact details';

					beforeEach( () => {

						intercept.datahub()
							.get( `/v3/contact/${ contactId }` )
							.reply( 200, intercept.stub( '/datahub/contact/detail' ) );
					} );

					describe( 'Without a report id', () => {
						it( 'Should fetch the contact and render the page', ( done ) => {

							agent
								.get( urls.report.viewContact( contactId ) )
								.end( checkPage( title, done ) );
						} );
					} );

					describe( 'With a report id', () => {
						it( 'Should fetch the report and the contact and render the page', ( done ) => {

							const reportId = '123';

							interceptReport( reportId );

							agent
								.get( urls.report.viewContact( contactId, reportId ) )
								.end( checkPage( title, done ) );
						} );
					} );
				} );
			} );

			describe( 'Report pages', () => {

				let reportId;

				beforeEach( () => {

					reportId = '123';
					interceptReport( reportId );
				} );

				afterEach( checkNock );

				describe( 'About the problem', () => {
					it( 'Should fetch the report and render the page', ( done ) => {

						app
							.get( urls.report.aboutProblem( reportId ) )
							.end( checkPage( 'Market Access - Report - About the problem', done ) );
					} );
				} );

				describe( 'Impact of the problem', () => {
					it( 'Should fetch the report and render the page', ( done ) => {

						app
							.get( urls.report.impact( reportId ) )
							.end( checkPage( 'Market Access - Report - Impact of the problem', done ) );
					} );
				} );

				describe( 'Legal obligations infringed', () => {
					it( 'Should fetch the report and render the page', ( done ) => {

						app
							.get( urls.report.legal( reportId ) )
							.end( checkPage( 'Market Access - Report - Legal obligations infringed', done ) );
					} );
				} );

				describe( 'Define type of market access barrier', () => {
					it( 'Should fetch the report and render the page', ( done ) => {

						app
							.get( urls.report.type( reportId ) )
							.end( checkPage( 'Market Access - Report - Define type of market access barrier', done ) );
					} );
				} );

				describe( 'Describe the next steps and what support you may need', () => {
					it( 'Should fetch the report and render the page', ( done ) => {

						app
							.get( urls.report.support( reportId ) )
							.end( checkPage( 'Market Access - Report - Describe the next steps and what support you may need', done ) );
					} );
				} );

				describe( 'Next steps the company affected have requested', () => {
					it( 'Should fetch the report and render the page', ( done ) => {

						app
							.get( urls.report.nextSteps( reportId ) )
							.end( checkPage( 'Market Access - Report - Next steps the company affected have requested', done ) );
					} );
				} );

				describe( 'Report detail', () => {
					it( 'Should fetch the report and render the page', ( done ) => {

						app
							.get( urls.report.detail( reportId ) )
							.end( checkPage( 'Market Access - Report details', done ) );
					} );
				} );
			} );
		} );

		describe( '404 page', function(){
			it( 'Should render the 404 page', function( done ){

				app
					.get( '/abc123' )
					.end( checkPage( 'Market Access - Not found', done, 404 ) );
			} );
		} );

		describe( 'Ping', function(){
			it( 'Should return a status of 200', function( done ){

				app
					.get( '/ping/' )
					.end( ( err, res ) => {

						checkResponse( res, 200 );
						done();
					} );
			} );
		} );

		describe( 'Login', () => {
			it( 'Should redirect to the sso page', ( done ) => {

				app
					.get( urls.login() )
					.end( ( err, res ) => {

						checkResponse( res, 302 );
						expect( res.headers.location ).toBeDefined();
						done();
					} );
			} );
		} );

		describe( 'Login callback', () => {
			it( 'Should redirect to the login page', ( done ) => {

				app
					.get( '/login/callback/' )
					.end( ( err, res ) => {

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
