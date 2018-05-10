module.exports = function( req, res, next ){

	const pass = ( req.session.ssoToken || /^\/(login)\b/.test( req.url ) );
	
	if( pass ){

		next();

	} else {

		req.session.returnPath = req.url;
		res.redirect( '/login/' );
	}
};
