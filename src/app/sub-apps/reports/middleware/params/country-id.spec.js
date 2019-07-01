const proxyquire = require( 'proxyquire' );
const modulePath = './country-id';

describe( 'Country Id param middleware', () => {

	let middleware;
	let validators;
	let req;
	let res;
	let next;
	let countryId;

	beforeEach( () => {

		validators = {
			isCountry: jasmine.createSpy( 'validators.isCountry' ),
		};

		( { req, res, next } = jasmine.helpers.mocks.middleware() );

		middleware = proxyquire( modulePath, {
			'../../../../lib/validators': validators,
		});
	} );

	afterEach( () => {

		expect( validators.isCountry ).toHaveBeenCalledWith( countryId );
	} );

	describe( 'When the country is valid', () => {
		it( 'Calls next', () => {

			validators.isCountry.and.callFake( () => true );

			middleware( req, res, next, countryId );

			expect( next ).toHaveBeenCalledWith();
		} );
	} );

	describe( 'When the country is valid', () => {
		it( 'Calls next', () => {

			validators.isCountry.and.callFake( () => false );

			middleware( req, res, next, countryId );

			expect( next ).toHaveBeenCalledWith( new Error( 'Invalid countryId' ) );
		} );
	} );
} );
