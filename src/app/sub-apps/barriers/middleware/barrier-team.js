const backend = require( '../../../lib/backend-service' );
const HttpResponseError = require( '../../../lib/HttpResponseError' );

module.exports = async ( req, res, next ) => {

	try {

		const { response, body } = await backend.barriers.team.get( req, req.barrier.id );

		if( response.isSuccess ){

			req.members = body.results.map( ( member ) => ({
				id: member.id,
				name: member.user.full_name,
				email: member.user.email,
				role: member.role,
				isCreator: member.default,
			} ) );
			res.locals.members = req.members;
			next();

		} else {

			throw new HttpResponseError( 'Unable to get team members', response, body );
		}

	} catch( e ){

		next( e );
	}
};
