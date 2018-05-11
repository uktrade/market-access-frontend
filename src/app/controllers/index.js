const backend = require( '../lib/backend-service' );
const logger = require( '../lib/logger' );

module.exports = async ( req, res ) => {

	try {

		const data = await backend.getUser( req );
		res.render( 'index', { data: data.body } );

	} catch( e ){

		logger.error( e );
		res.render( 'index', { data: 'No backend available' } );
	}
};
