const backend = require( '../lib/backend-service' );

module.exports = async ( req, res, next ) => {

	if( !req.session.user ){

		req.session.user = ( await backend.getUser( req ) ).body;
	}

	res.locals.user = req.session.user;
	next();
};
