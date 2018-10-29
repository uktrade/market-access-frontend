const backend = require( '../lib/backend-service' );
const validators = require( '../lib/validators' );
const viewModel = require( '../view-models/find-a-barrier' );

module.exports = async function( req, res, next ){

	const { country } = req.query;
	const filters = {};

	if( country && validators.isCountry( country ) ){
		filters.country = country;
	}

	try {

		const { response, body } = await backend.barriers.getAll( req, filters );

		if( response.isSuccess ){

			res.render( 'find-a-barrier', viewModel( {
				count: body.count,
				barriers: body.results,
				filters
			} ) );

		} else {

			next( new Error( `Got ${ response.statusCode } response from backend` ) );
		}

	} catch( e ) {

		next( e );
	}
};
