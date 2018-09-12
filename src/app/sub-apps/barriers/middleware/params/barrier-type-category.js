const validators = require( '../../../../lib/validators' );
const MAX_LENGTH = 20;
const isCategory = validators.isMetadata( 'barrierTypeCategories' );

module.exports = ( req, res, next, category ) => {

	if( category && category.length < MAX_LENGTH && isCategory( category ) ){

		req.category = category;
		next();

	} else {

		next( new Error( 'Invalid barrierTypeCategory' ) );
	}
};
