const backend = require( '../lib/backend-service' );

module.exports = async ( req, res, next ) => {

	if( !req.session.user ){

		try {

			req.session.user = ( await backend.getUser( req ) ).body;

		} catch( e ){

			return next( e );
		}
	}

	req.user = req.session.user;
	res.locals.user = req.session.user;
	next();
};
