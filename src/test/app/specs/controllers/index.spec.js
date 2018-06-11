const proxyquire = require( 'proxyquire' );
const modulePath = '../../../../app/controllers/index';

let controller;
let req;
let res;
let backend;
let ssoToken;
let next;

describe( 'Index controller', () => {

	beforeEach( () => {

		ssoToken = 'abc-123';
		backend = {
			getBarriers: jasmine.createSpy( 'backend.getBarriers' )
		};

		req = { session: { ssoToken } };
		res = { render: jasmine.createSpy( 'res.render' ) };
		next = jasmine.createSpy( 'next' );

		controller = proxyquire( modulePath, {
			'../lib/backend-service': backend
		} );
	} );

	describe( 'Without an error', () => {

		it( 'Should get the barriers and render the index page', async () => {

			const barrierResponse = {
				body: {
					results: [ { id: 1 } ]
				}
			};

			backend.getBarriers.and.callFake( () => Promise.resolve( barrierResponse ) );

			await controller( req, res, next );

			expect( next ).not.toHaveBeenCalled();
			expect( backend.getBarriers ).toHaveBeenCalledWith( req );
			expect( res.render ).toHaveBeenCalledWith( 'index', { barriers: barrierResponse.body.results } );
		} );
	} );

	describe( 'With an erro', () => {

		it( 'Should call next with the error', async () => {

			const err = new Error( 'issue with backend' );

			backend.getBarriers.and.callFake( () => Promise.reject( err ) );

			await controller( req, res, next );

			expect( next ).toHaveBeenCalledWith( err );
		} );
	} );
} );
