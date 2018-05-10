const ssoController = require( './controllers/sso' );

module.exports = function( express, app ){

	app.get( '/', ( req, res ) => {
		res.render( 'index' );
	} );

	app.get( '/login/', ssoController.authRedirect );
	app.get( '/login/callback/', ssoController.callback );
};
