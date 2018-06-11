const backend = require( '../lib/backend-service' );

module.exports = async ( req, res, next ) => {

	try {

		const { body } = await backend.getBarriers( req );

		res.render( 'index', { barriers: body.results } );

	} catch( e ){

		next( e );
	}
};
