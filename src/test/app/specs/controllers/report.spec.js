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

	describe( 'Index', () => {
	
		it( 'Should render the report page', () => {

			controller.index( req, res );

			expect( res.render ).toHaveBeenCalledWith( 'report/index' );
		} );
	} );

	describe( 'Start', () => {
	
		it( 'Should render the start page', () => {
	
			controller.start( req, res );

			expect( res.render ).toHaveBeenCalledWith( 'report/start' );
		} );
	} );
} );
