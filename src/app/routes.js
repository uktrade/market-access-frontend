const ssoController = require( './controllers/sso' );
const indexController = require( './controllers/index' );

module.exports = function( express, app ){

	app.get( '/', indexController );

	app.get( '/login/', ssoController.authRedirect );
	app.get( '/login/callback/', ssoController.callback );
};
