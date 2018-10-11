const detailVieWModel = require( '../view-models/detail' );

module.exports = {
	barrier: ( req, res ) => res.render( 'barriers/views/detail', detailVieWModel( req.barrier ) ),
	type: require( './type' ),
	interactions: require( './interactions' ),
	status: require( './status' ),
	sectors: require( './sectors' )
};
