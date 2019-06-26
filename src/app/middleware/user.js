const config = require( '../config' );
const backend = require( '../lib/backend-service' );

module.exports = async ( req, res, next ) => {

	if( !req.session.user ){

		try {

			const { response, body } = ( await backend.getUser( req ) );

			if( response.isSuccess ){

				const user = body;

				if( config.sso.bypass ){

					user.permitted_applications = [
						{
							'key': 'datahub-crm',
							'url': '',
							'name': ''
						},
						{
							'key': 'datahub-mi',
							'url': '',
							'name': ''
						},
						{
							'key': 'market-access',
							'url': '',
							'name': ''
						},
						{
							'key': 'find-exporters',
							'url': '',
							'name': ''
						}
					];
				}

				req.session.user = user;

			} else {

				next( new Error( `Unable to get user info, got ${ response.statusCode } response code` ) );
			}

		} catch( e ){

			return next( e );
		}
	}

	req.user = req.session.user;
	res.locals.user = req.session.user;
	next();
};
