const ssoController = require( './controllers/sso' );
const indexController = require( './controllers/index' );
const reportController = require( './controllers/report' );
const headerNav = require( './middleware/header-nav' );
const user = require( './middleware/user' );
const urls = require( './lib/urls' );

module.exports = function( express, app ){

	app.get( '/login/', ssoController.authRedirect );
	app.get( '/login/callback/', ssoController.callback );

	app.use( user );
	
	app.get( urls.index(), headerNav( { isDashboard: true } ), indexController );
	app.get( urls.report.index(), headerNav( { isReport: true } ), reportController.index );
	app.get( urls.report.start(), headerNav( { isReport: true } ), reportController.start );
	app.post( urls.report.start(), headerNav( { isReport: true } ), reportController.start );
};
