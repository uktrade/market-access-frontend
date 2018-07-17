const ssoController = require( './controllers/sso' );
const indexController = require( './controllers/index' );
const reportRoutes = require( './sub-apps/report/routes' );

const headerNav = require( './middleware/header-nav' );
const user = require( './middleware/user' );
const formErrors = require( './middleware/form-errors' );

module.exports = function( express, app ){

	app.get( '/login/', ssoController.authRedirect );
	app.get( '/login/callback/', ssoController.callback );

	app.use( user );
	app.use( formErrors );

	app.get( '/', headerNav( { isDashboard: true } ), indexController );
	app.use( '/report/', headerNav( { isReport: true } ), reportRoutes( express, express.Router() ) );
};
