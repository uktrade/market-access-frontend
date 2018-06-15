const backend = require( '../../lib/backend-service' );
const isNumeric = /^[0-9]+$/;

module.exports = async ( req, res, next ) => {

	const barrierId = req.params.barrierId;

	if( barrierId.length < 10 && isNumeric.test( barrierId ) ){

		if( !req.session.barrier ){

			try {

				const { response, body } = await backend.getBarrier( req, barrierId );

				if( response.isSuccess ){

					req.session.barrier = body;

				} else {

					next( new Error( 'Error response getting barrier' ) );
				}

			} catch( e ){

				next( e );
			}
		}

		req.barrier = req.session.barrier;
		res.locals.barrier = req.session.barrier;
		next();

	} else {

		next( new Error( 'Invalid barrierId' ) );
	}
};
