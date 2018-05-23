const navMiddleware = require( '../../../../app/middleware/header-nav' );

function check( resultsItem, activeItem ){

	const req = {};
	const res = { locals: {} };
	const next = jasmine.createSpy( 'next' );

	navMiddleware( activeItem )( req, res, next );

	expect( res.locals.headerNav ).toEqual( resultsItem );
	expect( next ).toHaveBeenCalled();
}

function checkTypes( name ){

	const activeItem = {};
	const resultsItem = {
		isDashboard: false,
		isReport: false,
		isFind: false
	};

	resultsItem[ name ] = true;

	activeItem[ name ] = true;

	check( resultsItem, activeItem );

	activeItem[ name ] = 'blah';

	check( resultsItem, activeItem );
}

describe( 'Header Nav Middelware', () => {

	describe( 'Calling with no args', () => {

		it( 'Should return false for each item', () => {

			const req = {};
			const res = { locals: {} };
			const next = jasmine.createSpy( 'next' );

			navMiddleware()( req, res, next );

			expect( res.locals.headerNav ).toEqual( {
				isDashboard: false,
				isReport: false,
				isFind: false
			} );
			expect( next ).toHaveBeenCalled();
		} );
	} );

	describe( 'isDashboard', () => {

		it( 'Should set dashboard to true', () => {

			checkTypes( 'isDashboard' );
		} );
	} );

	describe( 'isReport', () => {

		it( 'Should set report to true', () => {

			checkTypes( 'isReport' );
		} );
	} );

	describe( 'isFind', () => {

		it( 'Should set find to true', () => {

			checkTypes( 'isFind' );
		} );
	} );
} );
