const backend = require( './backend-request' );

module.exports = {

	getUser: ( req ) => backend.get( '/whoami/', req.session.ssoToken )
};
