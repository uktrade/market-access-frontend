const { isUuid } = require( '../../lib/validators' );

module.exports = function( req, res, next, id ){

	if( isUuid( id ) ){

		req.uuid = id;
		next();

	} else {

		next( new Error( 'Invalid uuid' ) );
	}
};
