const ssoController = require( './controllers/sso' );
const backend = require( './lib/backend-service' );

module.exports = function( express, app ){

	app.get( '/', async ( req, res ) => {

		try {

			const data = await backend.getUser();
			res.render( 'index', { data: data.body } );

		} catch( e ){

			res.render( 'index', { data: 'No backend available' } );
		}
	} );

	app.get( '/login/', ssoController.authRedirect );
	app.get( '/login/callback/', ssoController.callback );
};
