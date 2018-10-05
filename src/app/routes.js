const ssoController = require( './controllers/sso' );
const indexController = require( './controllers/index' );
const whatIsABarrierController = require( './controllers/what-is-a-barrier' );
const reportRoutes = require( './sub-apps/reports/routes' );
const barrierRoutes = require( './sub-apps/barriers/routes' );

const headerNav = require( './middleware/header-nav' );
const user = require( './middleware/user' );
const formErrors = require( './middleware/form-errors' );
const dashboardTabs = require( './middleware/dashboard-tabs' );

module.exports = function( express, app ){

	app.get( '/login/', ssoController.authRedirect );
	app.get( '/login/callback/', ssoController.callback );

	app.use( user );
	app.use( formErrors );

	app.get( '/', headerNav( { isDashboard: true } ), dashboardTabs, indexController.index );
	app.use( '/reports/', headerNav( { isReport: true } ), reportRoutes( express, express.Router() ) );
	app.use( '/barriers/', barrierRoutes( express, express.Router() ) );
	app.get( '/what-is-a-barrier/', whatIsABarrierController );
};
