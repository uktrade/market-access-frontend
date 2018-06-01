const backend = require( './backend-request' );

module.exports = {

	getMetadata: () => backend.get( '/metadata/' ),
	getUser: ( req ) => backend.get( '/whoami/', req.session.ssoToken )
};
