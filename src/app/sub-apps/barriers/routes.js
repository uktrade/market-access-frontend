const csurf = require( 'csurf' );
const controller = require( './controllers' );

const barrierId = require( './middleware/params/barrier-id' );

const csrfProtection = csurf();

module.exports = ( express, app ) => {

	const parseBody = express.urlencoded( { extended: false } );

	app.param( 'barrierId', barrierId );

	app.get( '/:barrierId/', controller.barrier );
	app.get( '/:barrierId/interactions/', controller.interactions );
	app.get( '/:barrierId/interactions/add-note', csrfProtection, controller.addNote );
	app.post( '/:barrierId/interactions/add-note', parseBody, csrfProtection, controller.addNote );

	return app;
};
