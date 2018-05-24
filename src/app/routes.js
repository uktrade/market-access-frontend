const ssoController = require( './controllers/sso' );
const indexController = require( './controllers/index' );
const reportController = require( './controllers/report' );
const headerNav = require( './middleware/header-nav' );
const user = require( './middleware/user' );

module.exports = function( express, app ){

	app.get( '/login/', ssoController.authRedirect );
	app.get( '/login/callback/', ssoController.callback );

	app.use( user );
	
	app.get( '/', headerNav( { isDashboard: true } ), indexController );
	app.get( '/report/', headerNav( { isReport: true } ), reportController.index );
	app.get( '/report/start/', headerNav( { isReport: true } ), reportController.start );
};
