
module.exports = function( express, app ){

	app.get( '/', ( req, res ) => {
		res.render( 'index' );
	} );
};
