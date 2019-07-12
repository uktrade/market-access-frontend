const proxyquire = require( 'proxyquire' );
const modulePath = './dashboard-data';
const realUrls = require( '../lib/urls' );

describe( 'Dashboard data', () => {

	let dashboardData;
	let req;
	let res;
	let next;
	let config;
	let urls;
	let indexResponse;
	let reportIndexResponse;

	beforeEach( () => {

		( { req, res, next } = jasmine.helpers.mocks.middleware() );

		config = {
			watchList: { maxLists: 3 }
		};
		urls = {
			index: jasmine.createSpy( 'urls.index' ),
			reports: {
				index: jasmine.createSpy( 'urls.reports.index' ),
			},
		};

		indexResponse = realUrls.index();
		reportIndexResponse = realUrls.reports.index();
		req.originalUrl = indexResponse;

		urls.index.and.callFake( () => indexResponse );
		urls.reports.index.and.callFake( () => reportIndexResponse );

		dashboardData = proxyquire( modulePath, {
			'../config': config,
			'../lib/urls': urls,
		} );
	} );

	afterEach( () => {
		expect( next ).toHaveBeenCalledWith();
	} );

	function createWatchList(){

		req.watchList = {
			version: 2,
			lists: [{
				name: 'List 1',
				filters: {}
			},{
				name: 'List 2',
				filters: {}
			}]
		};
	}

	describe( 'When there is a watch list', () => {
		describe( 'When list length is less than the max lists', () => {

			beforeEach( createWatchList );

			afterEach( () => {
				expect( res.locals.dashboardData.canAddWatchList ).toEqual( true );
			} );

			function checkIndexUrlCalls(){

				const indexCalls = urls.index.calls;

				expect( indexCalls.count() ).toEqual( 3 );
				expect( indexCalls.argsFor( 0 ) ).toEqual( [] );
				expect( indexCalls.argsFor( 1 ) ).toEqual( [ 0 ] );
				expect( indexCalls.argsFor( 2 ) ).toEqual( [ 1 ] );
			}

			describe( 'When on the index page', () => {
				describe( 'Without sorting query params', () => {
					it( 'creates the tabs and injects them into the response', () => {

						dashboardData( req, res, next );

						expect( res.locals.dashboardData.tabs ).toEqual([
							{ text: 'List 1', href: indexResponse, isCurrent: true },
							{ text: 'List 2', href: indexResponse, isCurrent: false },
							{ text: 'My draft barriers', href: reportIndexResponse, isCurrent: false }
						]);

						checkIndexUrlCalls();
					});
				} );

				describe( 'With a sorting query param', () => {
					it( 'ignores the sort param, creates the tabs and injects them into the response', () => {

						req.originalUrl = realUrls.index( 0, { sortBy: 'date' } );

						dashboardData( req, res, next );

						expect( res.locals.dashboardData.tabs ).toEqual([
							{ text: 'List 1', href: indexResponse, isCurrent: true },
							{ text: 'List 2', href: indexResponse, isCurrent: false },
							{ text: 'My draft barriers', href: reportIndexResponse, isCurrent: false }
						]);

						checkIndexUrlCalls();
					});
				} );

				describe( 'With a sorting query param and a list', () => {
					it( 'ignores the sort param, creates the tabs and injects them into the response', () => {

						req.originalUrl = realUrls.index( 1, { sortBy: 'date' } );

						dashboardData( req, res, next );

						expect( res.locals.dashboardData.tabs ).toEqual([
							{ text: 'List 1', href: indexResponse, isCurrent: false },
							{ text: 'List 2', href: indexResponse, isCurrent: true },
							{ text: 'My draft barriers', href: reportIndexResponse, isCurrent: false }
						]);

						checkIndexUrlCalls();
					});
				} );
			});

			describe( 'When on the reports page', () => {
				it( 'creates the tabs and injects them into the response', () => {

					req.originalUrl = realUrls.reports.index();

					dashboardData( req, res, next );

					expect( res.locals.dashboardData.tabs ).toEqual([
						{ text: 'List 1', href: indexResponse, isCurrent: false },
						{ text: 'List 2', href: indexResponse, isCurrent: false },
						{ text: 'My draft barriers', href: reportIndexResponse, isCurrent: true }
					]);

					checkIndexUrlCalls();
				});
			});
		} );

		describe( 'When list length is equal to the max lists', () => {
			it( 'Sets canAddWatchList to false', () => {

				config.watchList.maxLists = 2;

				createWatchList();

				dashboardData( req, res, next );

				expect( res.locals.dashboardData.canAddWatchList ).toEqual( false );
			} );
		} );

		describe( 'When list length is more than the max lists', () => {
			it( 'Sets canAddWatchList to false', () => {

				config.watchList.maxLists = 1;

				createWatchList();

				dashboardData( req, res, next );

				expect( res.locals.dashboardData.canAddWatchList ).toEqual( false );
			} );
		} );
	});

	describe( 'When there is not a watch list', () => {

		function checkIndexUrlCalls(){

			const indexCalls = urls.index.calls;

			expect( indexCalls.count() ).toEqual( 1 );
			expect( indexCalls.argsFor( 0 ) ).toEqual( [] );
		}

		describe( 'When on the index page', () => {
			it( 'creates the tabs and injects them into the response', () => {

				dashboardData( req, res, next );

				expect( res.locals.dashboardData.tabs ).toEqual([
					{ text: 'My watch list', href: indexResponse, isCurrent: true },
					{ text: 'My draft barriers', href: reportIndexResponse, isCurrent: false }
				]);

				checkIndexUrlCalls();
			});
		});

		describe( 'When on the reports page', () => {
			it( 'creates the tabs and injects them into the response', () => {

				req.originalUrl = realUrls.reports.index();

				dashboardData( req, res, next );

				expect( res.locals.dashboardData.tabs ).toEqual([
					{ text: 'My watch list', href: indexResponse, isCurrent: false },
					{ text: 'My draft barriers', href: reportIndexResponse, isCurrent: true }
				]);

				checkIndexUrlCalls();
			});
		});
	});
} );
