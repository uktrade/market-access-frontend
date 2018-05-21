const proxyquire = require( 'proxyquire' );
const modulePath = '../../../../app/controllers/index';

let controller;
let req;
let res;

describe( 'Index controller', () => {

	beforeEach( () => {

		req = {};
		res = { render: jasmine.createSpy( 'res.render' ) };
	
		controller = proxyquire( modulePath, {} );
	} );

	it( 'Should render the index page', () => {

		controller( req, res );

		expect( res.render ).toHaveBeenCalledWith( 'index' );
	} );
} );
