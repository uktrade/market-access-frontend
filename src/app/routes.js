const csurf = require( 'csurf' );

const ssoController = require( './controllers/sso' );
const indexController = require( './controllers/index' );
const whatIsABarrierController = require( './controllers/what-is-a-barrier' );
const findABarrierController = require( './controllers/find-a-barrier' );
const watchListController = require( './controllers/watch-list' );
const reportRoutes = require( './sub-apps/reports/routes' );
const barrierRoutes = require( './sub-apps/barriers/routes' );

const headerNav = require( './middleware/header-nav' );
const user = require( './middleware/user' );
const formErrors = require( './middleware/form-errors' );
const dashboardData = require( './middleware/dashboard-data' );

const uuidParam = require( './middleware/params/uuid' );

const csrfProtection = csurf();

module.exports = function( express, app ){

	const parseBody = express.urlencoded( { extended: false } );

	app.param( 'uuid', uuidParam );

	app.get( '/login/', ssoController.authRedirect );
	app.get( '/login/callback/', ssoController.callback );

	app.use( user );
	app.use( formErrors );

	app.get( '/me/', csrfProtection, indexController.me );
	app.post( '/me/', parseBody, csrfProtection, indexController.me );

	app.get( '/documents/:uuid/download/', indexController.documents.download ),

	app.get( '/', headerNav( { isDashboard: true } ), csrfProtection, dashboardData, indexController.index );
	app.use( '/reports/', headerNav( { isReport: true } ), reportRoutes( express, express.Router() ) );
	app.use( '/barriers/', barrierRoutes( express, express.Router() ) );
	app.get( '/what-is-a-barrier/', whatIsABarrierController );
	app.get( '/find-a-barrier/', headerNav( { isFind: true } ), findABarrierController.list );
	app.get( '/find-a-barrier/download/', findABarrierController.download );

	app.get( '/watch-list/save/', csrfProtection, watchListController.save );
	app.post( '/watch-list/save/', parseBody, csrfProtection, watchListController.save );
	app.get( '/watch-list/rename/:index/', csrfProtection, watchListController.rename );
	app.post( '/watch-list/rename/:index/', parseBody, csrfProtection, watchListController.rename );
	app.get( '/watch-list/remove/:index/', csrfProtection, watchListController.remove );
};
