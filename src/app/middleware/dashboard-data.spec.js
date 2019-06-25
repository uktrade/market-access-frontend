const urls = require( '../lib/urls' );
const dashboardData = require( './dashboard-data' );

describe( 'Dashboard data', () => {

	let req;
	let res;
	let next;

	beforeEach( () => {

		req = {
			user: { user_profile: {} },
			originalUrl: urls.index()
		};
		res = { locals: {} };
		next = jasmine.createSpy( 'next' );
	} );

	afterEach( () => {
		expect( next ).toHaveBeenCalledWith();
	} );

	describe( 'When there is a watch list', () => {

		beforeEach(() => {
			req.user.user_profile.watchList = {
				name: 'Hello1'
			};
		});

		describe( 'When on the index page', () => {
			describe( 'Without sorting query params', () => {
				it( 'creates the tabs and injects them into the response', () => {

					dashboardData( req, res, next );

					expect( res.locals.dashboardTabs ).toEqual([
						{ text: 'Hello1', href: '/', isCurrent: true },
						{ text: 'My draft barriers', href: '/reports/', isCurrent: false }
					]);
				});
			} );

			describe( 'With a sorting query param', () => {
				it( 'creates the tabs and injects them into the response', () => {

					req.originalUrl = urls.index( { sortBy: 'date' } );

					dashboardData( req, res, next );

					expect( res.locals.dashboardTabs ).toEqual([
						{ text: 'Hello1', href: '/', isCurrent: true },
						{ text: 'My draft barriers', href: '/reports/', isCurrent: false }
					]);
				});
			} );
		});

		describe( 'When on the reports page', () => {
			it( 'creates the tabs and injects them into the response', () => {

				req.originalUrl = urls.reports.index();

				dashboardData( req, res, next );

				expect( res.locals.dashboardTabs ).toEqual([
					{ text: 'Hello1', href: '/', isCurrent: false },
					{ text: 'My draft barriers', href: '/reports/', isCurrent: true }
				]);
			});
		});
	});

	describe( 'When there is not a watch list', () => {
		describe( 'When on the index page', () => {
			it( 'creates the tabs and injects them into the response', () => {

				dashboardData( req, res, next );

				expect( res.locals.dashboardTabs ).toEqual([
					{ text: 'My watch list', href: '/', isCurrent: true },
					{ text: 'My draft barriers', href: '/reports/', isCurrent: false }
				]);
			});
		});

		describe( 'When on the reports page', () => {
			it( 'creates the tabs and injects them into the response', () => {

				req.originalUrl = urls.reports.index();

				dashboardData( req, res, next );

				expect( res.locals.dashboardTabs).toEqual([
					{ text: 'My watch list', href: '/', isCurrent: false },
					{ text: 'My draft barriers', href: '/reports/', isCurrent: true }
				]);
			});
		});
	});
} );
