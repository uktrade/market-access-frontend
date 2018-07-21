const detailVieWModel = require( './view-models/detail' );

module.exports = {
	barrier: ( req, res ) => res.render( 'barriers/views/detail', detailVieWModel( req.barrier ) )
};
