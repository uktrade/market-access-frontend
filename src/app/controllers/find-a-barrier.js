const backend = require( '../lib/backend-service' );
const validators = require( '../lib/validators' );
const viewModel = require( '../view-models/find-a-barrier' );

const FILTERS = {
	country: validators.isCountry,
	sector: validators.isSector,
	type: validators.isBarrierType
};

function getFilters( query ){

	const filters = {};

	for( let [ name, validator ] of Object.entries( FILTERS ) ){

		const value = query[ name ];

		if( value && validator( value ) ){

			filters[ name ] = value;
		}
	}

	return filters;
}

module.exports = async function( req, res, next ){

	const filters = getFilters( req.query );

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
