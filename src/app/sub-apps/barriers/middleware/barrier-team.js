const backend = require( '../../../lib/backend-service' );
const HttpResponseError = require( '../../../lib/HttpResponseError' );

module.exports = async ( req, res, next ) => {

	try {

		const { response, body } = await backend.barriers.team.get( req, req.barrier.id );

		if( response.isSuccess ){

			res.locals.members = body.results.map( ( member ) => ({
				name: `${ member.user.first_name } ${ member.user.last_name }`,
				email: member.user.email,
				role: member.role
			}) );
			next();

		} else {

			throw new HttpResponseError( 'Unable to get team members', response, body );
		}

	} catch( e ){

		next( e );
	}
};
