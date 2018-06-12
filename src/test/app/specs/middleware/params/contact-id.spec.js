const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = '../../../../../app/middleware/params/contact-id';

describe( 'Contact Id param middleware', () => {

	let req;
	let res;
	let next;
	let id;
	let middleware;
	let datahub;

	beforeEach( () => {

		req = {};
		res = { locals: {} };
		next = jasmine.createSpy( 'next' );
		datahub = {
			getContact: jasmine.createSpy( 'datahub.getContact' )
		};

		middleware = proxyquire( modulePath, {
			'../../lib/datahub-service': datahub
		} );
	} );

	describe( 'When the id is valid', () => {

		beforeEach( () => {

			id = uuid();
		} );

		describe( 'When the response is a success', () => {

			it( 'Should add the contact to the req and locals', async () => {

				const contact = { name: 'test', id };
				const promise = Promise.resolve( { response: { isSuccess: true }, body: contact } );

				datahub.getContact.and.callFake( () => promise );

				await middleware( req, res, next, id );

				expect( datahub.getContact ).toHaveBeenCalledWith( req, id );
				expect( req.contact ).toEqual( contact );
				expect( res.locals.contact ).toEqual( contact );
				expect( next ).toHaveBeenCalledWith();
			} );
		} );

		describe( 'When the response is NOT a success', () => {

			it( 'Should call next with an error', async () => {

				const promise = Promise.resolve( { response: { isSuccess: false }, body: {} } );

				datahub.getContact.and.callFake( () => promise );

				await middleware( req, res, next, id );

				expect( datahub.getContact ).toHaveBeenCalledWith( req, id );
				expect( req.contact ).not.toBeDefined();
				expect( res.locals.contact ).not.toBeDefined();
				expect( next ).toHaveBeenCalledWith( new Error( 'Not a successful response from datahub' ) );
			} );
		} );

		describe( 'When the call errors', () => {

			it( 'Should call next with the error', async () => {

				const err = new Error( 'a datahub error' );
				const promise = Promise.reject( err );

				datahub.getContact.and.callFake( () => promise );

				await middleware( req, res, next, id );

				expect( datahub.getContact ).toHaveBeenCalledWith( req, id );
				expect( next ).toHaveBeenCalledWith( err );
			} );
		} );
	} );

	describe( 'When the id is invalid', () => {

		it( 'Should call next with the err', async () => {

			id = '<abc';

			await middleware( req, res, next, id );

			expect( datahub.getContact ).not.toHaveBeenCalled();
			expect( next ).toHaveBeenCalledWith( new Error( 'Invalid contact id' ) );
		} );
	} );
} );
