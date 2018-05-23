const ssoController = require( './controllers/sso' );
const indexController = require( './controllers/index' );
const reportController = require( './controllers/report' );
const headerNav = require( './middleware/header-nav' );

module.exports = function( express, app ){

	app.get( '/', headerNav( { isDashboard: true } ), indexController );

	app.get( '/login/', ssoController.authRedirect );
	app.get( '/login/callback/', ssoController.callback );

	app.get( '/report', headerNav( { isReport: true } ), reportController.start );
};
