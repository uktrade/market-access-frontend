const backend = require( '../lib/backend-service' );
const validators = require( '../lib/validators' );
const viewModel = require( '../view-models/find-a-barrier' );

const FILTERS = Object.entries( {
	country: validators.isCountryOrAdminArea,
	sector: validators.isSector,
	type: validators.isBarrierType,
	priority: validators.isBarrierPriority,
	region: validators.isOverseasRegion,
	search: ( str ) => !!str.length,
} );

function getFilters( query ){

	const filters = {};

	for( let [ name, validator ] of FILTERS ){

		const queryValue = ( query[ name ] || '' );
		const values = ( Array.isArray( queryValue ) ? queryValue : queryValue.split( ',' ) );
		const validValues = values.filter( validator );

		if( validValues.length ){

			filters[ name ] = validValues;
		}
	}

	return filters;
}

module.exports = {
	list: async function( req, res, next ){

		const filters = getFilters( req.query );

		try {

			const { response, body } = await backend.barriers.getAll( req, filters );

			if( response.isSuccess ){

				res.render( 'find-a-barrier', viewModel( {
					count: body.count,
					barriers: body.results,
					filters,
					queryString: req.query,
					editWatchList: req.query.editWatchList
				} ) );

			} else {

				next( new Error( `Got ${ response.statusCode } response from backend` ) );
			}

		} catch( e ) {

			next( e );
		}
	},

	download: ( req, res, next ) => {

		const filters = getFilters( req.query );
		const download = backend.barriers.download( req, filters );

		download.on( 'response', ( { statusCode } ) => {

			if( statusCode === 200 ){

				download.pipe( res );

			} else {

				const err = new Error( 'Unable to download data' );
				err.code = 'DOWNLOAD_FAIL';

				next( err );
			}
		} );
	},
};
