const backend = require( '../lib/backend-service' );
const UserWatchList = require( '../lib/user-watch-list' );

async function getUser( req ){

	const { response, body } = await backend.getUser( req );

	if( response.isSuccess ){

		req.session.user = body;

	} else {

		throw new Error( `Unable to get user info, got ${ response.statusCode } response code` );
	}
}

module.exports = async ( req, res, next ) => {

	if( !req.session.user ){

		try {

			await getUser( req, next );

		} catch( e ) {

			return next( e );
		}
	}

	try {

		const updated = await UserWatchList.migrateAndSave( req );

		if( updated ){

			await getUser( req, next );
		}

	} catch( e ){

		return next( e );
	}

	req.user = req.session.user;
	req.watchList = new UserWatchList( req );
	res.locals.user = req.session.user;
	next();
};
