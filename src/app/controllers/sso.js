const uuid = require( 'uuid/v4' );
const request = require( 'request' );
const config = require( '../config' );
const logger = require( '../lib/logger' );
const urls = require( '../lib/urls' );

const isAlpha = /^[a-zA-Z0-9-]+$/;

const ssoUrls = [ 'auth', 'token' ].reduce( ( params, param ) => {

	params[ param ] = `${ config.sso.protocol }://${ config.sso.domain}:${ config.sso.port }${ config.sso.path[ param ] }`;

	return params;
}, {} );

function stringify( params ){

	const arr = [];

	for( let paramKey in params ){

		arr.push( `${ paramKey }=${ encodeURIComponent( params[ paramKey ] ) }` );
	}

	return arr.join( '&' );
}

function checkCallbackErrors( errorParam, stateParam, codeParam, stateId ){

	if( errorParam ){

		return `Error with SSO: ${ errorParam }`;
	}

	if( stateParam !== stateId ){

		return `StateId mismatch: '${ stateParam }' !== '${ stateId }'`;
	}

	if( codeParam.length > config.sso.paramLength ){

		return ( `Code param too long: ${ codeParam.length }` );
	}

	if( !isAlpha.test( codeParam ) ){

		return 'Invalid code param';
	}
}

module.exports = {

	authRedirect: ( req, res, next ) => {

		const stateId = uuid();

		const urlParams = {
			response_type: 'code',
			client_id: config.sso.client,
			redirect_uri: config.sso.redirectUri,
			state: stateId
		};

		if( config.sso.mockCode ){

			urlParams.code = config.sso.mockCode;
		}

		req.session.oauthStateId = stateId; // used to check the callback received contains matching state param
		req.session.save( ( err ) => {

			if( err ){

				next( err );

			} else {

				logger.debug( 'Session saved to redis' );
				res.redirect( `${ ssoUrls.auth }?${ stringify( urlParams ) }` );
			}
		} );
	},

	callback: ( req, res, next ) => {

		const errorParam = req.query.error;
		const stateParam = req.query.state;
		const codeParam = req.query.code;
		const stateId = req.session.oauthStateId;

		if( !stateId ){

			logger.debug( 'No stateId in session, sending back to login' );
			return res.redirect( urls.login() );
		}

		const errMessage = checkCallbackErrors( errorParam, stateParam, codeParam, stateId );

		if( errMessage ){

			return next( new Error( errMessage ) );
		}

		request( {
			method: 'POST',
			url: ssoUrls.token,
			formData: {
				code: codeParam,
				grant_type: 'authorization_code',
				client_id: config.sso.client,
				client_secret: config.sso.secret,
				redirect_uri: config.sso.redirectUri,
			},
			json: true,

		}, ( err, response, data ) => {

			if( err ){

				logger.error( 'Error with SSO token request' );
				logger.error( err );
				return next( Error( 'Error with token request' ) );
			}

			if( data.access_token ){

				req.session.ssoToken = data.access_token;
				delete req.session.oauthStateId;

				res.redirect( req.session.returnPath || '/' );

				/* logger.debug( 'Callback data:' );

				try {

					logger.debug( JSON.stringify( Object.assign( {}, data, { access_token: '' } ), null, 2 ) );

				} catch( e ){

					logger.debug( e );
				} */

			} else {

				next( new Error( 'No access_token from SSO' ) );
			}
		} );
	}
};
