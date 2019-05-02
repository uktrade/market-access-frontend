const supertest = require( 'supertest' );
const proxyquire = require( 'proxyquire' );
//const winston = require( 'winston' );
const nock = require( 'nock' );
const uuid = require( 'uuid' );

const urls = require( './lib/urls' );
const logger = require( './lib/logger' );
const modulePath = './app';

const { intercept, getCsrfToken, getCsrfTokenFromQueryParam } = jasmine.helpers;

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

function checkModal( done ){

	return ( err, res ) => {

		if( err ){ done.fail( err ); }

		expect( res.text.indexOf( '<html' ) ).toEqual( -1 );
		expect( /.*?<div class="modal">/.test( res.text ) ).toEqual( true );
		done();
	};
}

function checkRedirect( location, done, responseCode = 302 ){

	return ( err, res ) => {

		if( err ){ return done.fail( err ); }

		expect( res.statusCode ).toEqual( responseCode );
		expect( res.headers.location ).toEqual( location );

		if( res.statusCode !== responseCode ){
			console.log( res.text );
		}

		done();
	};
}

function checkNock(){

	const isDone = nock.isDone();

	expect( isDone ).toEqual( true );

	if( !isDone ){
		console.log( 'PENDING NOCKS!!!!', nock.pendingMocks() );
	}
}

function interceptReport( reportId ){

	return intercept.backend()
		.get( `/reports/${ reportId }` )
		.reply( 200, intercept.stub( '/backend/reports/report' ) );
}

describe( 'App', function(){

	let app;
	let oldTimeout;

	beforeAll( function(){

		logger.configure({ silent: true });

		oldTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
		jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;

	} );

	beforeEach( () => {

		intercept.backend()
			.persist()
			.get( '/whoami' )
			.reply( 200, {} );
	} );

	afterEach( () => {

		nock.cleanAll();
	} );

	afterAll( function(){

		jasmine.DEFAULT_TIMEOUT_INTERVAL = oldTimeout;
	} );

	describe( 'Pages', function(){

		let appInstance;

		beforeAll( async () => {

			const appModule =  proxyquire( modulePath, {
				'morgan': () => ( req, res, next ) => next(),
				'./config': {
					isDev: true
				}
			} );

			intercept.backend()
				.persist()
				.get( '/metadata' )
				.reply( 200, intercept.stub( '/backend/metadata/' ) );

			appInstance = await appModule.create();

			app = supertest( appInstance );
		} );

		describe( 'index page', function(){
			it( 'Should render the index page', function( done ){

				intercept.backend()
					.get( /^\/barriers(\?.+)?$/ )
					.reply( 200, intercept.stub( '/backend/barriers/' ) );

				app
					.get( urls.index() )
					.end( checkPage( 'Market Access - Homepage', done ) );
			} );
		} );

		describe( 'User page', function(){
			it( 'Should render the me page', function( done ){

				app
					.get( urls.me() )
					.end( checkPage( 'Market Access - About me', done ) );
			} );
		} );

		describe( 'What is a barrier page', function(){
			it( 'Should render the page', function( done ){

				app
					.get( urls.whatIsABarrier() )
					.end( checkPage( 'Market Access - What is a barrier', done ) );
			} );
		} );

		describe( 'Find a barrier page', function(){
			it( 'Should render the page', function( done ){

				intercept.backend()
					.get( /^\/barriers(\?.+?)?$/ )
					.reply( 200, intercept.stub( '/backend/barriers/' ) );

				app
					.get( urls.findABarrier() )
					.end( checkPage( 'Market Access - Find a barrier', done ) );
			} );
		} );

		describe( 'documents', () => {
			describe( 'download', () => {
				describe( 'When the response is a success', () => {
					it( 'Should redirect to the url', ( done ) => {

						const documentId = uuid();
						const document_url = 'https://www.abc.com';

						intercept.backend()
							.get( `/documents/${ documentId }/download` )
							.reply( 200, { document_url } );

						app
							.get( urls.documents.download( documentId ) )
							.end( checkRedirect( document_url, done ) );
					} );
				} );
			} );
		} );

		describe( 'Barriers', () => {

			let barrierId;

			beforeEach( () => {

				barrierId = uuid();
			} );

			describe( 'When the barrier cannot be found', () => {
				it( 'Should render a 404 page', ( done ) => {

					intercept.backend()
						.get( `/barriers/${ barrierId }` )
						.reply( 404 );

					app
						.get( urls.barriers.detail( barrierId ) )
						.end( checkPage( 'Market Access - Not found', done, 404 ) );
				} );
			} );

			describe( 'With a barrierId param', () => {

				let barrier;

				beforeEach( () => {

					barrier = intercept.stub( '/backend/barriers/barrier' );
					barrier.id = barrierId;

					intercept.backend()
						.get( `/barriers/${ barrierId }` )
						.reply( 200, barrier )
						.persist();
				} );

				describe( 'Barrier detail', () => {

					beforeEach( () => {

						intercept.backend()
							.get( `/barriers/${ barrierId }/interactions` )
							.reply( 200, intercept.stub( '/backend/barriers/interactions' ) );

						intercept.backend()
							.get( `/barriers/${ barrier.id }/interactions` )
							.reply( 200, intercept.stub( '/backend/barriers/interactions' ) )
							.persist();

						intercept.backend()
							.get( `/barriers/${ barrier.id }/history` )
							.reply( 200, intercept.stub( '/backend/barriers/history' ));
					} );

					describe( 'The default page', () => {
						it( 'Should fetch the barrier and render the page', ( done ) => {

							app
								.get( urls.barriers.detail( barrierId ) )
								.end( checkPage( 'Market Access - Barrier details', done ) );
						} );
					} );

					describe( 'With notes', () => {
						describe( 'Adding', () => {
							describe( 'A GET', () => {
								it( 'Should render the page', ( done ) => {

									app.get( urls.barriers.notes.add( barrierId ) )
										.end( checkPage( 'Market Access - Barrier details - Add a note', done ) );
								} );
							} );
						} );

						describe( 'Editing', () => {
							describe( 'A GET', () => {
								it( 'Should render the page', ( done ) => {

									app.get( urls.barriers.notes.edit( barrierId, 7 ) )
										.end( checkPage( 'Market Access - Barrier details - Edit a note', done ) );
								} );
							} );
						} );

						describe( 'Deleting', () => {
							describe( 'A GET', () => {
								describe( 'A normal request', () => {
									it( 'Should render the page', ( done ) => {

										app.get( urls.barriers.notes.delete( barrierId, 7 ) )
											.end( checkPage( 'Market Access - Barrier details', done ) );
									} );
								} );

								describe( 'An AJAX request', () => {
									it( 'Should render a snippet', ( done ) => {

										app.get( urls.barriers.notes.delete( barrierId, 7 ) )
											.set( 'X-Requested-With', 'XMLHttpRequest' )
											.end( checkModal( done ) );
									} );
								} );
							} );
						} );

						describe( 'Documents', () => {
							describe( 'Cancel', () => {
								it( 'It should redirect to the barrier detail', ( done ) => {

									app.get( urls.barriers.notes.documents.cancel( barrierId, 7 ) )
										.end( checkRedirect( urls.barriers.detail( barrierId ), done ) );
								} );
							} );

							describe( 'Delete', () => {
								describe( 'When the backend returns a 200', () => {
									it( 'It should return 200', ( done ) => {

										const documentId = uuid();
										const noteId = 7;

										intercept.backend()
											.delete( `/documents/${ documentId }` )
											.reply( 200, '' );

										app.get( urls.barriers.notes.documents.delete( barrierId, noteId, documentId ) )
											.end( checkRedirect( urls.barriers.notes.edit( barrierId, noteId ), done ) );
									} );
								} );
							} );
						} );
					} );
				} );

				describe( 'Edit barrier', () => {
					describe( 'title', () => {
						it( 'Should fetch the barrier and render the page', ( done ) => {

							app
								.get( urls.barriers.edit.title( barrierId ) )
								.end( checkPage( 'Market Access - Barrier - Edit title', done ) );
						} );
					} );
					describe( 'product', () => {
						it( 'Should fetch the barrier and render the page', ( done ) => {

							app
								.get( urls.barriers.edit.product( barrierId ) )
								.end( checkPage( 'Market Access - Barrier - Edit product or service', done ) );
						} );
					} );

					describe( 'description', () => {
						it( 'Should fetch the barrier and render the page', ( done ) => {

							app
								.get( urls.barriers.edit.description( barrierId ) )
								.end( checkPage( 'Market Access - Barrier - Edit summary', done ) );
						} );
					} );

					describe( 'source', () => {
						it( 'Should fetch the barrier and render the page', ( done ) => {

							app
								.get( urls.barriers.edit.source( barrierId ) )
								.end( checkPage( 'Market Access - Barrier - Edit source', done ) );
						} );
					} );

					describe( 'priority', () => {
						it( 'Should fetch the barrier and render the page', ( done ) => {

							app
								.get( urls.barriers.edit.priority( barrierId ) )
								.end( checkPage( 'Market Access - Barrier - Edit priority', done ) );
						} );
					} );

					describe( 'euExitRelated', () => {
						it( 'Should fetch the barrier and render the page', ( done ) => {

							app
								.get( urls.barriers.edit.euExitRelated( barrierId ) )
								.end( checkPage( 'Market Access - Barrier - Edit EU exit related', done ) );
						} );
					} );

					describe( 'problemStatus', () => {
						it( 'Should fetch the barrier and render the page', ( done ) => {

							app
								.get( urls.barriers.edit.problemStatus( barrierId ) )
								.end( checkPage( 'Market Access - Barrier - Edit barrier scope', done ) );
						} );
					} );
				} );

				describe( 'Barrier sectors', () => {
					describe( 'Editing the sectors', () => {
						it( 'Should list the sectors', ( done ) => {

							app
								.get( urls.barriers.sectors.edit( barrierId ) )
								.end( checkPage( 'Market Access - Sectors affected by the barrier', done ) );
						} );
					} );

					describe( 'Listing the sectors', () => {
						it( 'Should list the sectors', ( done ) => {

							app
								.get( urls.barriers.sectors.list( barrierId ) )
								.end( checkPage( 'Market Access - Sectors affected by the barrier', done ) );
						} );
					} );

					describe( 'Adding a sector', () => {
						it( 'Should render the page', ( done ) => {

							app
								.get( urls.barriers.sectors.add( barrierId ) )
								.end( checkPage( 'Market Access - Barrier - Add an affected sector', done ) );
						} );
					} );

					describe( 'New sectors', () => {
						it( 'Should render the page', ( done ) => {

							app
								.get( urls.barriers.sectors.new( barrierId ) )
								.end( checkPage( 'Market Access - Barrier - Add an affected sector', done ) );
						} );
					} );
				} );

				describe( 'Barrier companies', () => {

					function interceptCompany( url ){

						intercept.datahub()
							.get( url )
							.reply( 200, intercept.stub( '/datahub/company/detail' ) );
					}

					describe( 'Editing a list of companies', () => {
						it( 'Should render the page', ( done ) => {

							app
								.get( urls.barriers.companies.edit( barrierId ) )
								.end( checkPage( 'Market Access - Barrier - Save or add another company', done ) );
						} );
					} );

					describe( 'Listing the companies', () => {
						it( 'Should render the page', ( done ) => {

							app
								.get( urls.barriers.companies.list( barrierId ) )
								.end( checkPage( 'Market Access - Barrier - Save or add another company', done ) );
						} );
					} );

					describe( 'Searching for a company', () => {
						describe( 'a GET', () => {
								it( 'Should render the page', ( done ) => {

								app
									.get( urls.barriers.companies.search( barrierId ) )
									.end( checkPage( 'Market Access - Barrier - Add an affected company', done ) );
							} );
						} );

						describe( 'a POST', () => {

							let agent;
							let token;
							let url;

							beforeEach( ( done ) => {

								agent = supertest.agent( appInstance );
								url = urls.barriers.companies.search( barrierId );

								agent
									.get( url )
									.end( ( err, res ) => {

										token = getCsrfToken( res, done.fail );
										done();
									} );
							} );

							function doPost( code, cb ){
								agent
									.post( url )
									.send( `_csrf=${ token }&query=${ uuid() }` )
									.expect( code )
									.end( cb );
							}

							describe( 'With a success from datahub', () => {
								it( 'Should render the page', ( done ) => {

									intercept.datahub()
										.post( '/v4/public/search/company' )
										.reply( 200, intercept.stub( '/datahub/search/company' ) );

										doPost( 200, checkPage( 'Market Access - Barrier - Add an affected company', done ) );
								} );
							} );

							describe( 'With a 500 error from datahub', () => {
								it( 'Should render an error page', ( done ) => {

									intercept.datahub()
										.post( '/v4/public/search/company' )
										.reply( 500, {} );

									doPost( 500, checkPage( 'Market Access - Error', done, 500 ) );
								} );
							} );

							describe( 'With a 403 error from datahub', () => {
								it( 'Should render an error page', ( done ) => {

									intercept.datahub()
										.post( '/v4/public/search/company' )
										.reply( 403, {} );

									doPost( 500, checkPage( 'Market Access - Error', done, 500 ) );
								} );
							} );
						} );
					} );

					describe( 'Details of a company', () => {

						let companyId;
						let barrierUrl;
						let datahubUrl;

						beforeEach( () => {

							companyId = uuid();
							barrierUrl = urls.barriers.companies.details( barrierId, companyId );
							datahubUrl = `/v4/public/company/${ companyId }`;
						} );

						describe( 'a GET', () => {
								it( 'Should render the page', ( done ) => {

								interceptCompany( datahubUrl );

								app
									.get( barrierUrl )
									.end( checkPage( 'Market Access - Barrier - Company details', done ) );
							} );
						} );

						describe( 'a POST', () => {

							let agent;
							let token;

							beforeEach( ( done ) => {

								agent = supertest.agent( appInstance );

								interceptCompany( datahubUrl );

								agent
									.get( barrierUrl )
									.end( ( err, res ) => {

										if( err ){ return done.fail( err ); }

										token = getCsrfToken( res, done.fail );
										done();
									} );
							} );

							function doPost( code, cb ){
								agent
									.post( barrierUrl )
									.send( `_csrf=${ token }` )
									.expect( code )
									.end( cb );
							}

							describe( 'With a success from datahub', () => {
								it( 'Should render the page', ( done ) => {

									interceptCompany( datahubUrl );

									doPost( 302, done );
								} );
							} );

							describe( 'With a 500 error from datahub', () => {
								it( 'Should render an error page', ( done ) => {

									intercept.datahub()
										.get( datahubUrl )
										.reply( 500, {} );

									doPost( 500, checkPage( 'Market Access - Error', done, 500 ) );
								} );
							} );

							describe( 'With a 403 error from datahub', () => {
								it( 'Should render an error page', ( done ) => {

									intercept.datahub()
										.get( datahubUrl )
										.reply( 403, {} );

									doPost( 500, checkPage( 'Market Access - Error', done, 500 ) );
								} );
							} );
						} );
					} );
				} );

				describe( 'Barrier Documents (AJAX)', () => {

					let documentId;

					beforeEach( () => {

						documentId = uuid();
					} );

					describe( 'Delete', () => {

						let token;
						let agent;
						let url;

						beforeEach( ( done ) => {

							intercept.backend()
								.get( `/barriers/${ barrier.id }/interactions` )
								.reply( 200, intercept.stub( '/backend/barriers/interactions' ) );

							intercept.backend()
								.get( `/barriers/${ barrier.id }/history` )
								.reply( 200, intercept.stub( '/backend/barriers/history' ) );

							agent = supertest.agent( appInstance );

							agent
								.get( urls.barriers.notes.add( barrierId ) )
								.end( ( err, res ) => {

									token = getCsrfTokenFromQueryParam( res, done.fail );
									url = urls.barriers.documents.delete( barrierId, documentId ) + `?_csrf=${ token }`;
									done();
								} );
						} );

						describe( 'When the API returns a 200', () => {
							it( 'Should return a 200', ( done ) => {

								intercept.backend()
									.delete( `/documents/${ documentId }` )
									.reply( 200, '{}' );

								agent.post( url )
									.send( '' )
									.end( ( err, res ) => {

										expect( res.statusCode ).toEqual( 200 );
										expect( res.text ).toEqual( '{}' );
										done();
									} );
							} );
						} );

						describe( 'When the API returns a 404', () => {
							it( 'Should return a 200', ( done ) => {

								intercept.backend()
									.delete( `/documents/${ documentId }` )
									.reply( 404, '{}' );

								agent.post( url )
									.send( '' )
									.end( ( err, res ) => {

										expect( res.statusCode ).toEqual( 200 );
										expect( res.text ).toEqual( '{}' );
										done();
									} );
							} );
						} );
					} );
				} );

				describe( 'Barrier location', () => {
					describe( 'list', () => {
						it( 'Should render the page', ( done ) => {

							app
								.get( urls.barriers.location.list( barrierId ) )
								.end( checkPage( 'Market Access - Barrier - Edit location', done ) );
						} );
					} );

					describe( 'edit', () => {
						it( 'Should render the page', ( done ) => {

							app
								.get( urls.barriers.location.edit( barrierId ) )
								.end( checkPage( 'Market Access - Barrier - Edit location', done ) );
						} );
					} );

					describe( 'country', () => {
						it( 'Should render the page', ( done ) => {

							const agent = supertest.agent( appInstance );

							agent
								.get( urls.barriers.location.edit( barrierId ) )
								.end( ( err ) => {

									if( err ){ return done.fail( err ); }

									agent
										.get( urls.barriers.location.country( barrierId ) )
										.end( checkPage( 'Market Access - Barrier - Edit Country', done ) );
								} );
						} );
					} );

					describe( 'adminAreas', () => {

						let agent;

						beforeEach( ( done ) => {

							agent = supertest.agent( appInstance );

							agent
								.get( urls.barriers.location.edit( barrierId ) )
								.end( ( err ) => {

									if( err ){ return done.fail( err ); }

									done();
								} );
						} );

						describe( 'add', () => {
							it( 'Should render the page', ( done ) => {

								agent
									.get( urls.barriers.location.adminAreas.add( barrierId ) )
									.end( checkPage( 'Market Access - Barrier - Add an admin area', done ) );
							} );
						} );

						describe( 'remove', () => {
							it( 'Should redirect back to the add page', ( done ) => {

								const adminAreaId = '8ad3f33a-ace8-40ec-bd2c-638fdc3024ea';//Alabama

								agent
									.get( urls.barriers.location.adminAreas.add( barrierId ) )
									.end( ( err, res ) => {

										if( err ){ return done.fail( err ); }

										const token = getCsrfToken( res, done.fail );

										agent
											.post( urls.barriers.location.adminAreas.add( barrierId ) )
											.send( `_csrf=${ token }&adminAreas=${ adminAreaId }` )
											.redirects( 1 )
											.end( ( err, res ) => {

												if( err ){ return done.fail( err ); }

												const token = getCsrfToken( res, done.fail );

												agent
													.post( urls.barriers.location.adminAreas.remove( barrierId ) )
													.send( `_csrf=${ token }&adminArea=${ adminAreaId }` )
													.end( checkRedirect( urls.barriers.location.list( barrierId ), done ) );
											} );
									} );
							} );
						} );
					} );
				} );
			} );

			describe( 'With a uuid param', () => {
				describe( 'Barrier Documents', () => {
					describe( 'Cancel', () => {
						it( 'Should redirect to the barrier detail page', ( done ) => {

							app.get( urls.barriers.documents.cancel( barrierId, uuid() ) )
								.end( checkRedirect( urls.barriers.detail( barrierId ), done ) );
						} );
					} );
				} );
			} );

			describe( 'Barrier status', () => {
				it( 'Should render the page', ( done ) => {

					const barrier = intercept.stub( '/backend/barriers/barrier' );
					barrier.status = 2;

					intercept.backend()
						.get( `/barriers/${ barrierId }` )
						.reply( 200, barrier );

					app
						.get( urls.barriers.status( barrierId ) )
						.end( checkPage( 'Market Access - Barrier edit status', done ) );
				} );
			} );
		} );

		describe( 'Reports', () => {
			describe( 'Index page', () => {
				it( 'Should render a list of reports', ( done ) => {

					intercept.backend()
					.get( /^\/reports(\?.+)?$/ )
					.reply( 200, intercept.stub( '/backend/reports/' ) );

					app
						.get( urls.reports.index() )
						.end( checkPage( 'Market Access - Draft barriers', done ) );
				} );
			} );

			describe( 'Delete', () => {

				let reportId;

				beforeEach( () => {

					reportId = uuid();

					intercept.backend()
						.get( `/reports/${ reportId }` )
						.reply( 200, intercept.stub( '/backend/reports/report' ) );
				} );

				describe( 'With AJAX', () => {
					it( 'Should return a snippet', ( done ) => {

						app
							.get( urls.reports.delete( reportId ) )
							.set( 'X-Requested-With', 'XMLHttpRequest' )
							.end( checkModal( done ) );
					} );
				} );

				describe( 'A normal request', () => {
					it( 'Should return the page', ( done ) => {

						intercept.backend()
							.get( /^\/reports(\?.+)?$/ )
							.reply( 200, intercept.stub( '/backend/reports/' ) );

						app
							.get( urls.reports.delete( reportId ) )
							.end( checkPage( 'Market Access - Draft barriers', done ) );
					} );
				} );
			} );

			describe( 'Report a barrier', () => {
				describe( 'New report page', () => {
					it( 'Should render the new page', ( done ) => {

						app
							.get( urls.reports.new() )
							.end( checkPage( 'Market Access - Add a barrier', done ) );
					} );
				} );

				describe( 'Start page', () => {

					const title = 'Market Access - Add - Status of the barrier';

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

					const title = 'Market Access - Add - Status of the barrier';

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

					const title = 'Market Access - Add - Location of the barrier';

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

					describe( 'Has admin areas', () => {
						describe( 'A country with admin areas', () => {

							const countryId = '81756b9a-5d95-e211-a939-e4115bead28a';//USA
							let token;

							beforeEach( ( done ) => {

								agent
									.get( urls.reports.country() )
									.end( ( err, res ) => {

										token = getCsrfToken( res, done.fail );

										done();
									} );
							} );

							describe( 'Without a reportId', () => {

								beforeEach( ( done ) => {

									agent
										.post( urls.reports.country() )
										.send( `_csrf=${ token }&country=${ countryId }` )
										.end( checkRedirect( urls.reports.hasAdminAreas( undefined, countryId ), done ) );
								} );

								it( 'Should render the has admin areas page', ( done ) => {

									agent
										.get( urls.reports.hasAdminAreas( undefined, countryId ) )
										.end( checkPage( 'Market Access - Add - Location of the barrier', done ) );
								} );

								describe( 'Answering the question', () => {

									let hasAdminAreasUrl;
									let token;
									let id;

									beforeEach( ( done ) => {

										hasAdminAreasUrl = urls.reports.hasAdminAreas( undefined, countryId );

										agent
											.get( hasAdminAreasUrl )
											.end( ( err, res ) => {

												if( err ){ return done.fail( err ); }

												token = getCsrfToken( res, done );
												id = uuid();

												intercept.backend()
													.post( '/reports' )
													.reply( 200, { id } );

												done();
											} );
									} );

									describe( 'When answering yes', () => {
										it( 'Should redirect to the next step', ( done ) => {

											agent
												.post( hasAdminAreasUrl )
												.send( `_csrf=${ token }&hasAdminAreas=true` )
												.end( checkRedirect( urls.reports.hasSectors( id ), done ) );
										} );
									} );

									describe( 'When answering no', () => {
										it( 'Should render the admin areas page', ( done ) => {

											agent
												.post( hasAdminAreasUrl )
												.send( `_csrf=${ token }&hasAdminAreas=false` )
												.end( checkRedirect( urls.reports.adminAreas.add( undefined, countryId ), done ) );
										} );

										describe( 'Adding an admin area', () => {

											let addUrl = urls.reports.adminAreas.add( undefined, countryId );

											beforeEach( ( done ) => {
												agent
													.post( hasAdminAreasUrl )
													.send( `_csrf=${ token }&hasAdminAreas=false` )
													.end( checkRedirect( addUrl, done ) );
											} );

											it( 'Should render the page', ( done ) => {

												agent
													.get( addUrl )
													.end( checkPage( 'Market Access - Report - Add an admin area', done ) );
											} );

											describe( 'POSTing the form', () => {
												it( 'Should redirect back to the list page', ( done ) => {

													agent
														.get( addUrl )
														.end( ( err, res ) => {

															if( err ){ return done.fail( err ); }

															const token = getCsrfToken( res, done );
															const adminAreaId = '8ad3f33a-ace8-40ec-bd2c-638fdc3024ea';//Alabama

															agent
																.post( addUrl )
																.send( `_csrf=${ token }&adminAreas=${ adminAreaId }` )
																.end( checkRedirect( urls.reports.adminAreas.list( undefined, countryId ), done ) );
														} );
												} );
											} );
										} );
									} );
								} );
							} );

							describe( 'With a reportId', () => {
								it( 'Should render the has admin areas page', ( done ) => {

									const reportId = '1-2-3';
									const mockReport = intercept.stub( '/backend/reports/report' );

									intercept.backend()
										.get( `/reports/${ reportId }` )
										.reply( 200, mockReport )
										.persist();

									agent
										.post( urls.reports.country( reportId ) )
										.send( `_csrf=${ token }&country=${ countryId }` )
										.end( checkRedirect( urls.reports.hasAdminAreas( mockReport.id, countryId ), () => {

											agent
												.get( urls.reports.hasAdminAreas( reportId, countryId ) )
												.end( checkPage( 'Market Access - Add - Location of the barrier', done ) );
										} ) );
								} );
							} );
						} );
					} );
				} );

				describe( 'Report pages', () => {

					let reportId;

					beforeEach( () => {

						reportId = uuid();
					} );

					afterEach( checkNock );

					describe( 'Incomplete report', () => {

						beforeEach( () => {
							interceptReport( reportId ).persist();
						} );

						describe( 'About the barrier', () => {
							describe( 'A GET', () => {
								it( 'Should fetch the report and render the page', ( done ) => {

									app
										.get( urls.reports.aboutProblem( reportId ) )
										.end( checkPage( 'Market Access - Add - About the barrier', done ) );
								} );
							} );

							describe( 'A POST', () => {

								let agent;
								let token;
								let stubId;

								beforeEach( ( done ) => {

									const data = intercept.stub( '/backend/reports/report' );

									stubId = data.id;

									intercept.backend()
										.put( `/reports/${ stubId }` )
										.reply( 200, data );

									agent = supertest.agent( appInstance );

									agent
										.get( urls.reports.aboutProblem( reportId ) )
										.end( ( err, res ) => {

											token = getCsrfToken( res, done.fail );
											done();
										} );
								} );

								describe( 'Save and exit', () => {
									it( 'Should save the data and redirect to the report detail', ( done ) => {

										agent
											.post( urls.reports.aboutProblem( reportId ) )
											.send( `_csrf=${ token }&action=exit&item=test` )
											.end( checkRedirect( urls.reports.detail( stubId ), done ) );
									} );
								} );

								describe( 'Save and continue', () => {
									it( 'Should save the data, submit the form and redirect to the barrier detail', ( done ) => {

										agent
											.post( urls.reports.aboutProblem( reportId ) )
											.send( `_csrf=${ token }&item=test&barrierSource=COMPANY&euExitRelated=2&barrierTitle=testing&description=abc` )
											.end( checkRedirect( urls.reports.summary( stubId ), done ) );
									} );
								} );
							} );
						} );

						describe( 'Summary of the barrier', () => {
							describe( 'A GET', () => {
								it( 'Should fetch the report and render the page', ( done ) => {

									app
										.get( urls.reports.summary( reportId ) )
										.end( checkPage( 'Market Access - Add - Summarise the problem', done ) );
								} );
							} );

							describe( 'A POST', () => {

								let agent;
								let token;
								let stubId;

								beforeEach( ( done ) => {

									const data = intercept.stub( '/backend/reports/report' );

									stubId = data.id;

									intercept.backend()
										.put( `/reports/${ stubId }` )
										.reply( 200, data );

									agent = supertest.agent( appInstance );

									agent
										.get( urls.reports.summary( reportId ) )
										.end( ( err, res ) => {

											token = getCsrfToken( res, done.fail );
											done();
										} );
								} );

								describe( 'Save and exit', () => {
									it( 'Should save the data and redirect to the report detail', ( done ) => {

										agent
											.post( urls.reports.summary( reportId ) )
											.send( `_csrf=${ token }&action=exit&description=test` )
											.end( checkRedirect( urls.reports.detail( stubId ), done ) );
									} );
								} );

								describe( 'Save and continue', () => {
									it( 'Should save the data, submit the form and redirect to the barrier detail', ( done ) => {

										intercept.backend()
											.put( `/reports/${ stubId }/submit` )
											.reply( 200, intercept.stub( '/backend/reports/report' ) );

										agent
											.post( urls.reports.summary( reportId ) )
											.send( `_csrf=${ token }&description=test1` )
											.end( checkRedirect( urls.barriers.detail( stubId ), done ) );
									} );
								} );
							} );
						} );

						describe( 'Report detail', () => {
							it( 'Should fetch the report and render the page', ( done ) => {

								app
									.get( urls.reports.detail( reportId ) )
									.end( checkPage( 'Market Access - Add - Barrier details', done ) );
							} );
						} );
					} );

					describe( 'Complete report', () => {

						beforeEach( () => {

							intercept.backend()
								.persist()
								.get( `/reports/${ reportId }` )
								.reply( 200, intercept.stub( '/backend/reports/report.completed' ) );
						} );

						describe( 'Submit report', () => {

							let token;
							let agent;

							beforeEach( ( done ) => {

								agent = supertest.agent( appInstance );

								agent
									.get( urls.reports.detail( reportId ) )
									.end( ( err, res ) => {

										//console.log( res.text );

										token = getCsrfToken( res, done.fail );
										done();
									} );
							} );

							it( 'Should submit the report and redirect to the barrier detail', ( done ) => {

								const data = intercept.stub( '/backend/reports/report.completed' );

								intercept.backend()
									.put( `/reports/${ data.id }/submit` )
									.reply( 200, data );

								agent
									.post( urls.reports.submit( reportId ) )
									.send( `_csrf=${ token }` )
									.end( checkRedirect( urls.barriers.detail( data.id ), done ) );
							} );
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

				intercept.backend()
					.get( '/ping.xml' )
					.reply( 200, 'OK' );

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
