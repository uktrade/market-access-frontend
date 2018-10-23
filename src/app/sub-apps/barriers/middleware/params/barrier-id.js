const backend = require( '../../../../lib/backend-service' );
const isUuid = /^[0-9a-zA-Z-]+$/;

module.exports = async ( req, res, next, barrierId ) => {

	if( isUuid.test( barrierId ) ){

		let barrier;

		try {

			const { response, body } = await backend.barriers.get( req, barrierId );

			if( response.isSuccess ){

				barrier = body;
				req.barrier = barrier;
				res.locals.barrier = barrier;
				next();

			} else {

				if( response.statusCode === 404 ){

					res.status( 404 );
					res.render( 'error/404' );

				} else {

					next( new Error( 'Error response getting barrier' ) );
				}
			}

		} catch( e ){

			next( e );
		}

	} else {

		next( new Error( 'Invalid barrierId' ) );
	}
};
