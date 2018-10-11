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
	app.get( '/:barrierId/interactions/', controller.interactions.list );

	app.get( '/:barrierId/interactions/add-note/', controller.interactions.addNote );
	app.post( '/:barrierId/interactions/add-note/', controller.interactions.addNote );

	app.get( '/:barrierId/status/', controller.status.index );
	app.post( '/:barrierId/status/', controller.status.index );

	app.get( '/:uuid/status/resolved/', controller.status.resolved );
	app.get( '/:uuid/status/hibernated/', controller.status.hibernated );
	app.get( '/:uuid/status/open/', controller.status.open );

	app.get( '/:barrierId/type/', controller.type.category );
	app.post( '/:barrierId/type/', controller.type.category );

	app.get( '/:barrierId/type/:barrierTypeCategory', controller.type.list );
	app.post( '/:barrierId/type/:barrierTypeCategory', controller.type.list );

	app.get( '/:barrierId/sectors/', controller.sectors.list );
	app.post( '/:barrierId/sectors/', controller.sectors.list );
	app.post( '/:barrierId/sectors/remove/', controller.sectors.remove );
	app.get( '/:barrierId/sectors/add/', controller.sectors.add );
	app.post( '/:barrierId/sectors/add/', controller.sectors.add );

	return app;
};
