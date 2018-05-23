const controller = require( '../../../../app/controllers/report' );

describe( 'Report controller', () => {

	let req;
	let res;

	beforeEach( () => {
	
		req = {};
		res = {
			render: jasmine.createSpy( 'res.render' )
		};
	} );

	it( 'Should render the report page', () => {

		controller.start( req, res );

		expect( res.render ).toHaveBeenCalledWith( 'report/index' );
	} );
} );
