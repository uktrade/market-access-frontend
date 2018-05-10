const backend = require( './backend-request' );

module.exports = {

	getUser: ( token ) => backend.get( '/whoami/', token )
};
