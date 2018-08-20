const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = './company-id';

describe( 'Company Id param middleware', () => {

	let req;
	let res;
	let next;
	let id;
	let middleware;
	let datahub;

	beforeEach( () => {

		req = {};
		res = { locals: {}, render: jasmine.createSpy( 'res.render' ) };
		next = jasmine.createSpy( 'next' );
		datahub = {
			getCompany: jasmine.createSpy( 'datahub.getCompany' )
		};

		middleware = proxyquire( modulePath, {
			'../../../../lib/datahub-service': datahub
		} );
	} );

	describe( 'When the id is valid', () => {

		beforeEach( () => {

			id = uuid();
		} );

		describe( 'When the response is a success', () => {
			it( 'Should add the company to the req and locals', async () => {

				const company = { name: 'test', id };
				const promise = Promise.resolve( { response: { isSuccess: true }, body: company } );

				datahub.getCompany.and.callFake( () => promise );

				await middleware( req, res, next, id );

				expect( datahub.getCompany ).toHaveBeenCalledWith( req, id );
				expect( req.company ).toEqual( company );
				expect( res.locals.company ).toEqual( company );
				expect( next ).toHaveBeenCalledWith();
			} );
		} );

		describe( 'When the response is NOT a success', () => {
			it( 'Should call next with an error', async () => {

				const promise = Promise.resolve( { response: { isSuccess: false }, body: {} } );

				datahub.getCompany.and.callFake( () => promise );

				await middleware( req, res, next, id );

				expect( datahub.getCompany ).toHaveBeenCalledWith( req, id );
				expect( req.company ).not.toBeDefined();
				expect( res.locals.company ).not.toBeDefined();
				expect( next ).toHaveBeenCalledWith( new Error( 'Not a successful response from datahub' ) );
			} );

			describe( 'When the statusCode is 403', () => {
				it( 'Should render the 403 page', async () => {

					const promise = Promise.resolve( { response: { isSuccess: false, statusCode: 403 }, body: {} } );

					datahub.getCompany.and.callFake( () => promise );

					await middleware( req, res, next, id );

					expect( datahub.getCompany ).toHaveBeenCalledWith( req, id );
					expect( req.company ).not.toBeDefined();
					expect( res.locals.company ).not.toBeDefined();
					expect( res.render ).toHaveBeenCalledWith( 'reports/views/error/data-hub/403' );
				} );
			} );
		} );

		describe( 'When the call errors', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'a datahub error' );
				const promise = Promise.reject( err );

				datahub.getCompany.and.callFake( () => promise );

				await middleware( req, res, next, id );

				expect( datahub.getCompany ).toHaveBeenCalledWith( req, id );
				expect( next ).toHaveBeenCalledWith( err );
			} );
		} );
	} );

	describe( 'When the id is invalid', () => {
		it( 'Should call next with the err', async () => {

			id = '<abc';

			await middleware( req, res, next, id );

			expect( datahub.getCompany ).not.toHaveBeenCalled();
			expect( next ).toHaveBeenCalledWith( new Error( 'Invalid company id' ) );
		} );
	} );
} );
