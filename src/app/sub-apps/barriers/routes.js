const csurf = require( 'csurf' );
const controller = require( './controllers' );

const barrierIdParam = require( './middleware/params/barrier-id' );
const barrierTypeCategoryParam = require( './middleware/params/barrier-type-category' );
const uuidParam = require( '../../middleware/params/uuid' );

const csrfProtection = csurf();

module.exports = ( express, app ) => {

	const parseBody = express.urlencoded( { extended: false } );

	app.param( 'barrierId', barrierIdParam );
	app.param( 'uuid', uuidParam );
	app.param( 'barrierTypeCategory', barrierTypeCategoryParam );

	app.use( parseBody, csrfProtection );

	app.get( '/:barrierId/', controller.barrier );
	app.get( '/:barrierId/interactions/', controller.interactions );

	app.get( '/:barrierId/interactions/add-note/', controller.addNote );
	app.post( '/:barrierId/interactions/add-note/', controller.addNote );

	app.get( '/:barrierId/status/', controller.status );
	app.post( '/:barrierId/status/', controller.status );

	app.get( '/:uuid/status/resolved/', controller.statusResolved );
	app.get( '/:uuid/status/hibernated/', controller.statusHibernated );
	app.get( '/:uuid/status/open/', controller.statusOpen );

	app.get( '/:barrierId/type/', controller.type.category );
	app.post( '/:barrierId/type/', controller.type.category );

	app.get( '/:barrierId/type/:barrierTypeCategory', controller.type.list );
	app.post( '/:barrierId/type/:barrierTypeCategory', controller.type.list );

	return app;
};
