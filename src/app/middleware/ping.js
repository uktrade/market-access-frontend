const backend = require( '../lib/backend-service' );

module.exports = async function( req, res, next ){

	if( req.url === '/ping/' ){

		const { response, body } = await backend.ping();
		const contentType = response.headers[ 'content-type' ];

		if( contentType ){

			res.set( 'Content-Type', contentType );
		}

		res.status( response.statusCode );
		res.send( body );

	} else {

		next();
	}
};
