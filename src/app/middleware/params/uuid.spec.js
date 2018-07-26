const uuid = require( 'uuid/v4' );
const paramMiddleware = require( './uuid' );

describe( 'uuid param middleware', () => {

	let req;
	let res;
	let next;

	beforeEach( () => {

		req = {};
		res = {};
		next = jasmine.createSpy( 'next' );
	} );

	describe( 'With a valid uuid', () => {
		it( 'Will put the param in the req and call next', () => {

			const id = uuid();

			paramMiddleware( req, res, next, id );

			expect( req.uuid ).toEqual( id );
			expect( next ).toHaveBeenCalledWith();
		} );
	} );

	describe( 'With an invalid uuid', () => {
		it( 'Will call next with an error', () => {

			const id = 'abc_x-y/z';

			paramMiddleware( req, res, next, id );
			expect( next ).toHaveBeenCalledWith( new Error( 'Invalid uuid' ) );
		} );
	} );
} );
