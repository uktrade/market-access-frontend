const proxyquire = require( 'proxyquire' );
const modulePath = './barrier-type-category';

describe( 'barrierTypeCategory param middleware', () => {

	let req;
	let res;
	let next;
	let category;
	let validators;
	let validator;
	let middleware;

	beforeEach( () => {

		req = {};
		res = { locals: {} };
		next = jasmine.createSpy( 'next' );
		validator = jasmine.createSpy( 'validator' );

		validators = {
			isMetadata: jasmine.createSpy( 'validators.isMetadata' ).and.callFake( () => validator )
		};

		middleware = proxyquire( modulePath, {
			'../../../../lib/validators': validators
		} );
	} );

	it( 'Should call isMetadata with the correct name', () => {

		expect( validators.isMetadata ).toHaveBeenCalledWith( 'barrierTypeCategories' );
	} );

	describe( 'With a valid category', () => {
		it( 'Should put the category in the request and call next', () => {

			category = 'abc123';

			validator.and.callFake( () => true );

			middleware( req, res, next, category );

			expect( validator ).toHaveBeenCalledWith( category );
			expect( req.category ).toEqual( category );
			expect( next ).toHaveBeenCalledWith();
		} );
	} );

	describe( 'With an invalid category', () => {

		let err;

		beforeEach( () => {

			err = new Error( 'Invalid barrierTypeCategory' );
		} );

		afterEach( () => {

			expect( res.locals ).toEqual( {} );
			expect( next ).toHaveBeenCalledWith( err );
		} );

		describe( 'When it is too long', () => {
			it( 'Should throw an error', () => {

				middleware( req, res, next, 'abcdefghijklmnopqrstuvwxyz' );

				expect( validator ).not.toHaveBeenCalled();
			} );
		} );
		describe( 'When it is not in the metadata', () => {
			it( 'Should throw an error', () => {

				validator.and.callFake( () => false );

				middleware( req, res, next, 'ab' );
			} );
		} );
	} );
} );
