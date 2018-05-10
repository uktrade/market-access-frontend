const config = require( '../config' );
const logger = require( '../lib/logger' );

module.exports = function( req, res, next ){

	if( config.sso.bypass ){

		logger.debug( 'Bypassing SSO' );
		req.session.ssoToken = 'ssobypass';
	}

	next();
};
