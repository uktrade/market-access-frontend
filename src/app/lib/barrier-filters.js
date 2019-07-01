const validators = require( './validators' );

const FILTERS = Object.entries( {
	country: validators.isCountryOrAdminArea,
	sector: validators.isSector,
	type: validators.isBarrierType,
	priority: validators.isBarrierPriority,
	region: validators.isOverseasRegion,
	search: ( str ) => !!str.length,
} );

module.exports = {

	FILTERS,

	getFromQueryString: function( query ){

		const filters = {};

		for( let [ name, validator ] of FILTERS ){

			const queryValue = ( query[ name ] );

			if( queryValue ){

				const values = ( Array.isArray( queryValue ) ? queryValue : queryValue.split( ',' ) );
				const validValues = values.filter( validator );

				if( validValues.length ){

					filters[ name ] = validValues;
				}
			}
		}

		return filters;
	}
};

