const supertest = require( 'supertest' );
const proxyquire = require( 'proxyquire' );
//const winston = require( 'winston' );
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

/*
function getSelectOption( res, name ){

	const startTag = new RegExp( '<select.*?name="' + name + '">' );
	const optionWithValue = /<option.+?value="(.+)"/;

	let text = res.text;

	const selectPosition = text.search( startTag );

	text = text.substring( selectPosition );

	const selectEndPosition = text.indexOf( '</select>' );
	const options = text.substring( 0, selectEndPosition );
	const valueMatches = options.match( optionWithValue );

	return valueMatches && valueMatches[ 1 ];
}
*/
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
		.get( `/reports/${ reportId }` )
		.reply( 200, intercept.stub( '/backend/reports/report' ) );
}

describe( 'App', function(){

	let app;
	let oldTimeout;

	beforeAll( function(){

		logger.configure({ silent: true });

		oldTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
		jasmine.DEFAULT_TIMEOUT_INTERVAL = 3000;

		intercept.backend()
			.persist()
			.get( '/whoami' )
			.reply( 200, {} );
	} );

	afterAll( function(){

		jasmine.DEFAULT_TIMEOUT_INTERVAL = oldTimeout;
	} );

	describe( 'Pages', function(){

		let appInstance;

		beforeAll( async () => {

			intercept.backend()
				.persist()
				.get( '/metadata' )
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
					.get( /\/barriers(\?country=[a-z0-9-]+)?$/ )
					.reply( 200, intercept.stub( '/backend/barriers/' ) );

				app
					.get( urls.index() )
					.end( checkPage( 'Market Access - Homepage', done ) );
			} );
		} );

		describe( 'what is a barrier page', function(){
			it( 'Should render the page', function( done ){

				app
					.get( urls.whatIsABarrier() )
					.end( checkPage( 'Market Access - What is a barrier', done ) );
			} );
		} );

		describe( 'Barriers', () => {
			describe( 'Barrier detail', () => {
				it( 'Should fetch the barrier and render the page', ( done ) => {

					const barrierId = 'abc-123';

					intercept.backend()
						.get( `/barriers/${ barrierId }` )
						.reply( 200, intercept.stub( '/backend/barriers/barrier' ) );

					app
						.get( urls.barriers.detail( barrierId ) )
						.end( checkPage( 'Market Access - Barrier details', done ) );
				} );
			} );

			describe( 'Barrier interactions', () => {
				it( 'Should fetch the barrier and render the page', ( done ) => {

					const barrierId = 'abc-123';
					const barrier = intercept.stub( '/backend/barriers/barrier' );

					intercept.backend()
						.get( `/barriers/${ barrierId }` )
						.reply( 200, barrier );

					intercept.backend()
						.get( `/barriers/${ barrier.id }/interactions` )
						.reply( 200, intercept.stub( '/backend/barriers/interactions' ) );

					app
						.get( urls.barriers.interactions( barrierId ) )
						.end( checkPage( 'Market Access - Barrier updates', done ) );
				} );
			} );

			describe( 'Barrier status', () => {
				describe( 'Resolved', () => {
					it( 'Should render the page', ( done ) => {

						const barrierId = 'abc-123';

						app
							.get( urls.barriers.statusResolved( barrierId ) )
							.end( checkPage( 'Market Access - Barrier resolved', done ) );
					} );
				} );

				describe( 'Hibernated', () => {
					it( 'Should render the page', ( done ) => {

						const barrierId = 'abc-123';

						app
							.get( urls.barriers.statusHibernated( barrierId ) )
							.end( checkPage( 'Market Access - Barrier paused', done ) );
					} );
				} );

				describe( 'Open', () => {
					it( 'Should render the page', ( done ) => {

						const barrierId = 'abc-123';

						app
							.get( urls.barriers.statusOpen( barrierId ) )
							.end( checkPage( 'Market Access - Barrier open', done ) );
					} );
				} );
			} );
		} );

		describe( 'Reports', () => {
			describe( 'Index page', () => {
				it( 'Should render a list of reports', ( done ) => {

					intercept.backend()
					.get( '/reports' )
					.reply( 200, intercept.stub( '/backend/reports/' ) );

					app
						.get( urls.reports.index() )
						.end( checkPage( 'Market Access - Reports', done ) );
				} );
			} );

			describe( 'Report a barrier', () => {
				describe( 'New report page', () => {
					it( 'Should render the new page', ( done ) => {

						app
							.get( urls.reports.new() )
							.end( checkPage( 'Market Access - Report a barrier', done ) );
					} );
				} );

				describe( 'Start page', () => {

					const title = 'Market Access - Report - Status of the barrier';

					describe( 'Without a reportId', () => {
						it( 'Should render the start page', ( done ) => {

							app
								.get( urls.reports.start() )
								.end( checkPage( title, done ) );
						} );
					} );

					describe( 'With a reportId', () => {
						it( 'Should fetch the report and render the start page', ( done ) => {

							const reportId = '1';

							intercept.backend()
								.get( `/reports/${ reportId }` )
								.reply( 200, intercept.stub( '/backend/reports/report' ) );

							app
								.get( urls.reports.start( reportId ) )
								.end( checkPage( title, done ) );
						} );
					} );
				} );

				describe( 'Is resolved page', () => {

					const title = 'Market Access - Report - Status of the barrier';

					let agent;

					beforeEach( ( done ) => {

						agent = supertest.agent( appInstance );

						agent
							.get( urls.reports.start() )
							.end( ( err, res ) => {

								const token = getCsrfToken( res, done.fail );

								agent
									.post( urls.reports.start() )
									.send( `_csrf=${ token }&status=1` )
									.expect( 302, done );
							} );
					} );

					describe( 'Without a reportId', () => {
						it( 'Should render the is resolved page', ( done ) => {

							agent
								.get( urls.reports.isResolved() )
								.end( checkPage( title, done ) );
						} );
					} );

					describe( 'With a reportId', () => {
						it( 'Should fetch the report and render the is resolved page', ( done ) => {

							const reportId = '1';

							intercept.backend()
								.get( `/reports/${ reportId }` )
								.reply( 200, intercept.stub( '/backend/reports/report' ) );

							agent
								.get( urls.reports.isResolved( reportId ) )
								.end( checkPage( title, done ) );
						} );
					} );
				} );

				describe( 'Barrier location page', () => {

					const title = 'Market Access - Report - Location of the barrier';

					let agent;

					beforeEach( ( done ) => {

						agent = supertest.agent( appInstance );

						agent
							.get( urls.reports.start() )
							.end( ( err, res ) => {

								const token = getCsrfToken( res, done.fail );

								agent
									.post( urls.reports.start() )
									.send( `_csrf=${ token }&status=1` )
									.expect( 302 )
									.redirects( 1 )
									.end( ( err, res ) => {

										const token = getCsrfToken( res, done.fail );

										agent
											.post( urls.reports.isResolved() )
											.send( `_csrf=${ token }&isResolved=false` )
											.expect( 302 )
											.end( done );
									} );
							} );
					} );

					describe( 'Without a reportId', () => {
						it( 'Should render the barrier location page', ( done ) => {

							agent
								.get( urls.reports.country() )
								.end( checkPage( title, done ) );
						} );
					} );

					describe( 'With a reportId', () => {
						it( 'Should fetch the report and render the barrier location page', ( done ) => {

							const reportId = '1';

							intercept.backend()
								.get( `/reports/${ reportId }` )
								.reply( 200, intercept.stub( '/backend/reports/report' ) );

							agent
								.get( urls.reports.country( reportId ) )
								.end( checkPage( title, done ) );
						} );
					} );
				} );

				xdescribe( 'Company search page', () => {

					let agent;

					beforeAll( async ( done ) => {

						agent = supertest.agent( appInstance );

						agent
							.get( urls.reports.start() )
							.end( ( err, res ) => {

								const token = getCsrfToken( res, done.fail );

								agent
									.post( urls.reports.start() )
									.send( `_csrf=${ token }&status=1&emergency=true` )
									.expect( 302, done );
							} );
					} );

					describe( 'Without a report id', () => {
						it( 'Should render the company search page', ( done ) => {

							agent
								.get( urls.reports.companySearch() )
								.end( checkPage( 'Market Access - Report - Search for company', done ) );
						} );
					} );

					describe( 'With a report id', () => {

						afterEach( checkNock );

						it( 'Should fetch the report and render the company search page', ( done ) => {

							const reportId = '1234';

							interceptReport( reportId );

							agent
								.get( urls.reports.companySearch( reportId ) )
								.end( checkPage( 'Market Access - Report - Search for company', done ) );
						} );
					} );
				} );

				xdescribe( 'Company details', () => {

					let companyId;
					let agent;

					beforeEach( ( done ) => {

						companyId = 'd829a9c6-cffb-4d6a-953b-3e02a2b33028';

						agent = supertest.agent( appInstance );

						agent
							.get( urls.reports.start() )
							.end( ( err, res ) => {

								const token = getCsrfToken( res, done.fail );

								agent
									.post( urls.reports.start() )
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
									.get( urls.reports.companyDetails( companyId ) )
									.end( checkPage( title, done ) );
							} );
						} );

						describe( 'With a report id', () => {
							it( 'Should fetch the report and render the details of a company', ( done ) => {

								const reportId = '789';

								interceptReport( reportId );

								agent
									.get( urls.reports.companyDetails( companyId, reportId ) )
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
								.get( urls.reports.companyDetails( companyId ) )
								.end( checkPage( 'Market Access - Error', done, 500 ) );
						} );
					} );
				} );

				xdescribe( 'Company contacts', () => {

					let companyId;
					let agent;

					beforeEach( ( done ) => {

						companyId = 'd829a9c6-cffb-4d6a-953b-3e02a2b33028';

						intercept.datahub()
							.get( `/v3/company/${ companyId }` )
							.reply( 200, intercept.stub( '/datahub/company/detail' ) );

						agent = supertest.agent( appInstance );

						agent
							.get( urls.reports.start() )
							.end( ( err, res ) => {

								if( err ){ return done.fail( err ); }

								const token = getCsrfToken( res, done.fail );

								agent
									.post( urls.reports.start() )
									.send( `_csrf=${ token }&status=1&emergency=false` )
									.expect( 302 )
									.end( ( err ) => {

										if( err ){ return done.fail( err ); }

										agent
											.get( urls.reports.companyDetails( companyId ) )
											.expect( 200 )
											.end( ( err, res ) => {

												if( err ){ return done.fail( err ); }

												const token = getCsrfToken( res, done.fail );

												agent
													.post( urls.reports.companySearch() )
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
							.get( urls.reports.contacts( companyId ) )
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
									.get( urls.reports.viewContact( contactId ) )
									.end( checkPage( title, done ) );
							} );
						} );

						describe( 'With a report id', () => {
							it( 'Should fetch the report and the contact and render the page', ( done ) => {

								const reportId = '123';

								interceptReport( reportId );

								agent
									.get( urls.reports.viewContact( contactId, reportId ) )
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

					describe( 'About the barrier', () => {
						it( 'Should fetch the report and render the page', ( done ) => {

							app
								.get( urls.reports.aboutProblem( reportId ) )
								.end( checkPage( 'Market Access - Report - About the barrier', done ) );
						} );
					} );

					xdescribe( 'Define type of market access barrier', () => {

						describe( 'Selecting the category', () => {
							it( 'Should fetch the report and render the category options', ( done ) => {

								app
									.get( urls.reports.typeCategory( reportId ) )
									.end( checkPage( 'Market Access - Report - Define type of market access barrier - Category', done ) );
							} );
						} );

						describe( 'Selecting a barrier type', () => {
							describe( 'When a category has not been chosen', () => {
								it( 'Should redirect to the category page', ( done ) => {

									app
										.get( urls.reports.type( reportId ) )
										.end( ( err, res ) => {
											checkResponse( res, 302 );
											done();
										} );
								} );
							} );

							describe( 'When a category has been selected', () => {

								let agent;

								beforeEach( ( done ) => {

									agent = supertest.agent( appInstance );

									agent
										.get( urls.reports.typeCategory( reportId ) )
										.end( ( err, res ) => {

											const token = getCsrfToken( res, done.fail );

											interceptReport( reportId );

											agent
												.post( urls.reports.typeCategory( reportId ) )
												.send( `_csrf=${ token }&category=GOODS` )
												.expect( 302, done );
										} );
								} );

								it( 'Should fetch the report and render the page', ( done ) => {

									interceptReport( reportId );

									agent
										.get( urls.reports.type( reportId ) )
										.end( checkPage( 'Market Access - Report - Define type of market access barrier', done ) );
								} );
							} );
						} );
					} );

					describe( 'Report detail', () => {
						it( 'Should fetch the report and render the page', ( done ) => {

							app
								.get( urls.reports.detail( reportId ) )
								.end( checkPage( 'Market Access - Report details', done ) );
						} );
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
				.get( '/metadata' )
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
