const backend = require( '../../../lib/backend-service' );
const HttpResponseError = require( '../../../lib/HttpResponseError' );

module.exports = async ( req, res, next ) => {

	try {

		const { response, body } = await backend.barriers.assessment.get( req, req.barrier.id );

		if( response.isSuccess ){

			req.assessment = body;
			next();

		} else if( response.statusCode === 404 ){

			next();

		} else {

			throw new HttpResponseError( 'Unable to get barrier assessment', response, body );
		}

	} catch( e ){

		next( e );
	}
};
