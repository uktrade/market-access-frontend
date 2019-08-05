const config = require( '../config' );
const makeRequest = require( './make-request' );
//const ssoUrl = 'https://sso.trade.uat.uktrade.io';
const ssoUrl = `${ config.sso.protocol }://${ config.sso.domain }:${ config.sso.port }`;
const { token } = config.sso.api;

const sendRequest = makeRequest( ssoUrl );

module.exports = {

	get: ( path ) => sendRequest( 'GET', path, { token } ),
};
