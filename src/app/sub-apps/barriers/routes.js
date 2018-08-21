const csurf = require( 'csurf' );
const controller = require( './controllers' );

const barrierId = require( './middleware/params/barrier-id' );
const uuidParam = require( '../../middleware/params/uuid' );

const csrfProtection = csurf();

module.exports = ( express, app ) => {

	const parseBody = express.urlencoded( { extended: false } );

	app.param( 'barrierId', barrierId );
	app.param( 'uuid', uuidParam );

	app.get( '/:barrierId/', controller.barrier );
	app.get( '/:barrierId/interactions/', controller.interactions );
	app.get( '/:barrierId/interactions/add-note/', csrfProtection, controller.addNote );
	app.post( '/:barrierId/interactions/add-note/', parseBody, csrfProtection, controller.addNote );
	app.get( '/:barrierId/status/', csrfProtection, controller.status );
	app.post( '/:barrierId/status/', parseBody, csrfProtection, controller.status );
	app.get( '/:uuid/status/resolved', controller.statusResolved );
	app.get( '/:uuid/status/hibernated', controller.statusHibernated );
	app.get( '/:uuid/status/open', controller.statusOpen );

	return app;
};
