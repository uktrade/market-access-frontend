const urls = require( '../lib/urls' );
const dashboardData = require( './dashboard-data' );

describe( 'Dashboard data', () => {

	let req;
	let res;
	let next;

	beforeEach( () => {
		req = { 
			session: { user: { userProfile: {} } },
			originalUrl: urls.index()
		};
		res = { locals: {} };
		next = jasmine.createSpy( 'next' );
	} );

	afterEach( () => {
		expect( next ).toHaveBeenCalledWith();
	} );

	describe('When there is a watch list', () => {

		beforeEach(() => {
			req.session.user.userProfile.watchList = {
				name: 'Hello1'
			};
		});

		describe('When on the index page', () => {
			it('creates the tabs and injects them into the response', () => {

				dashboardData(req, res, next);

				expect(res.locals.tabList).toEqual([
					{ text: 'Hello1', href: '/', isCurrent: true }, 
					{ text: 'My draft barriers', href: '/reports/', isCurrent: false }
				]);
			});
		});

		describe('When on the reports page', () => {
			it('creates the tabs and injects them into the response', () => {
				req.originalUrl = urls.reports.index();

				dashboardData(req, res, next);

				expect(res.locals.tabList).toEqual([
					{ text: 'Hello1', href: '/', isCurrent: false }, 
					{ text: 'My draft barriers', href: '/reports/', isCurrent: true }
				]);
			});
		});
	});

	describe('When there is not a watch list', () => {
		describe('When on the index page', () => {
			it('creates the tabs and injects them into the response', () => {

				dashboardData(req, res, next);

				expect(res.locals.tabList).toEqual([
					{ text: 'My watch list', href: '/', isCurrent: true }, 
					{ text: 'My draft barriers', href: '/reports/', isCurrent: false }
				]);
			});
		});

		describe('When on the reports page', () => {
			it('creates the tabs and injects them into the response', () => {
				req.originalUrl = urls.reports.index();

				dashboardData(req, res, next);

				expect(res.locals.tabList).toEqual([
					{ text: 'My watch list', href: '/', isCurrent: false }, 
					{ text: 'My draft barriers', href: '/reports/', isCurrent: true }
				]);
			});
		});
	});
} );
