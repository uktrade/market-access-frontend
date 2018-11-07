const config = require( '../../../config' );
const detailVieWModel = require( '../view-models/detail' );

module.exports = {

	barrier: ( req, res ) => {

		let addCompany = ( config.addCompany || !!req.query.addCompany );

		res.render( 'barriers/views/detail', detailVieWModel( req.barrier, addCompany ) );
	},

	edit: require( './edit' ),
	type: require( './type' ),
	interactions: require( './interactions' ),
	status: require( './status' ),
	sectors: require( './sectors' ),
	companies: require( './companies' ),
};
