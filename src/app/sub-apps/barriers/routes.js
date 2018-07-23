const controller = require( './controllers' );

const barrierId = require( './middleware/params/barrier-id' );


module.exports = ( express, app ) => {

	app.param( 'barrierId', barrierId );

	app.get( '/:barrierId/', controller.barrier );

	return app;
};
