const config = require( '../../../config' );
const detailVieWModel = require( '../view-models/detail' );

module.exports = {

	barrier: ( req, res ) => {

		const addCompany = ( config.addCompany || !!req.query.addCompany );
		const createdFlash = req.flash( 'barrier-created' );
		const isNew = createdFlash && createdFlash.length === 1;

		if( isNew ){

			res.locals.toast = {
				heading: 'Barrier added to the service',
				message: 'Continue to add more detail to your barrier'
			};
		}

		res.render( 'barriers/views/detail', detailVieWModel( req.barrier, addCompany ) );
	},

	edit: require( './edit' ),
	type: require( './type' ),
	interactions: require( './interactions' ),
	status: require( './status' ),
	sectors: require( './sectors' ),
	companies: require( './companies' ),
};
