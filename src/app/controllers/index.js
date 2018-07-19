const backend = require( '../lib/backend-service' );
const dashboardViewModel = require( '../lib/view-models/dashboard' );

module.exports = async ( req, res, next ) => {

	try {

		const { response, body } = await backend.barriers.getAll( req );

		if( response.isSuccess ){

			res.render( 'index', dashboardViewModel( body.results ) );

		} else {

			throw new Error( `Got ${ response.statusCode } response from backend` );
		}

	} catch( e ){

		next( e );
	}
};
