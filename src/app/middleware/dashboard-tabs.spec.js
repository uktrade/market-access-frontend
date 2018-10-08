const middleware = require( './dashboard-tabs' );

describe( 'Dashboard tabs', () => {

	let req;
	let res;
	let next;

	beforeEach( () => {

		req = {};
		res = { locals: {} };
		next = jasmine.createSpy( 'next' );
	} );

	afterEach( () => {

		expect( next ).toHaveBeenCalledWith();
	} );

	describe( 'When the user has a country', () => {
		it( 'Should add a country property', () => {

			req.user = { country: { id: 123 } };

			middleware( req, res, next );

			expect( res.locals.tabData.country ).toBeDefined();
			expect( res.locals.tabData.country.count ).toBeDefined();

			expect( res.locals.tabData.unfinished ).toBeDefined();
			expect( res.locals.tabData.unfinished.count ).toBeDefined();
		} );
	} );

	describe( 'When the user does NOT have a country', () => {
		it( 'Should add an all property', () => {

			middleware( req, res, next );

			expect( res.locals.tabData.all ).toBeDefined();
			expect( res.locals.tabData.all.count ).toBeDefined();

			expect( res.locals.tabData.unfinished ).toBeDefined();
			expect( res.locals.tabData.unfinished.count ).toBeDefined();
		} );
	} );
} );
