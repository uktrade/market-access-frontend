const formErrors = require( './form-errors' );

describe( 'Form errors middleware', () => {

	let req;
	let res;
	let next;

	beforeEach( () => {

		req = {};
		res = { locals: {} };
		next = jasmine.createSpy( 'next' );

		formErrors( req, res, next );
	} );

	it( 'Should add functions to the request', () => {

		expect( req.error ).toBeDefined();
		expect( req.hasErrors ).toBeDefined();
	} );

	describe( 'Adding an error', () => {
		it( 'Should add the errors array to the locals', () => {

			const name = 'test';
			const text = 'test value';

			req.error( name, text );

			expect( res.locals.errors ).toBeDefined();
			expect( res.locals.errors.length ).toEqual( 1 );
			expect( res.locals.errors[ 0 ] ).toEqual( { href: '#' + name, text } );
		} );
	} );

	describe( 'Adding more than one error', () => {
		it( 'Should add them to the array', () => {

			req.error( 'test1', 'test value 1' );
			req.error( 'test2', 'test value 2' );
			req.error( 'test3', 'test value 3' );

			expect( res.locals.errors.length ).toEqual( 3 );
		} );
	} );

	describe( 'Checking if there are errors', () => {

		describe( 'When no errors have been added', () => {
			it( 'Should return false', () => {

				expect( req.hasErrors() ).toEqual( false );
			} );
		} );

		describe( 'When there are errors', () => {
			it( 'Should return true', () => {

				req.error( 'test', 'test' );
				expect( req.hasErrors() ).toEqual( true );
			} );
		} );
	} );
} );
