const config = require( '../config' );
const makeRequest = require( './make-request' );

const sendRequest = makeRequest( config.datahub.url, {
	credentials: {
		id: config.datahub.hawk.id,
		key: config.datahub.hawk.key,
		algorithm: 'sha256',
	},
	defaultContentType: ''
} );

module.exports = {

	get: ( path ) => sendRequest( 'GET', path ),
	post: ( path, body ) => sendRequest( 'POST', path, { body } )
};
