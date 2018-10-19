const proxyquire = require( 'proxyquire' );
const modulePath = './find-a-barrier';

describe( 'Find a barrier controller', () => {

	let controller;
	let req;
	let res;
	const template = 'find-a-barrier';

	beforeEach( () => {

		req = {
			query: {}
		};
		res = {
			render: jasmine.createSpy( 'res.render' )
		};

		controller = proxyquire( modulePath, {} );
	} );

	describe( 'The default', () => {
		it( 'Should render the template', () => {

			controller( req, res );

			expect( res.render ).toHaveBeenCalledWith( template );
		} );
	} );
} );
