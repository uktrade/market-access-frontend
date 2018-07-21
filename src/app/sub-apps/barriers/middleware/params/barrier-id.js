const backend = require( '../../../../lib/backend-service' );
const isUuid = /^[0-9a-zA-Z-]+$/;

module.exports = async ( req, res, next ) => {

	const barrierId = req.params.barrierId;

	if( isUuid.test( barrierId ) ){

		let barrier;

		try {

			const { response, body } = await backend.barriers.get( req, barrierId );

			if( response.isSuccess ){

				barrier = body;

			} else {

				next( new Error( 'Error response getting barrier' ) );
			}

		} catch( e ){

			next( e );
		}

		req.barrier = barrier;
		res.locals.barrier = barrier;
		next();

	} else {

		next( new Error( 'Invalid barrierId' ) );
	}
};
