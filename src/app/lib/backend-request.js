const config = require( '../config' );
const makeRequest = require( './make-request' );

const sendRequest = makeRequest( config.backend.url, {
	enabled: config.backend.hawk.enabled,
	credentials: {
		id: config.backend.hawk.id,
		key: config.backend.hawk.key,
		algorithm: 'sha256'
	},
	defaultContentType: ( config.isDev ? 'text/plain': '' ),
} );

module.exports = {

	get: ( path, token ) => sendRequest( 'GET', path, { token } ),
	post: ( path, token, body ) => sendRequest( 'POST', path, { token, body } ),
	patch: ( path, token, body ) => sendRequest( 'PATCH', path, { token, body } ),
	put: ( path, token, body ) => sendRequest( 'PUT', path, { token, body } ),
	delete: ( path, token, body ) => sendRequest( 'DELETE', path, { token, body } ),
};
