const validators = require( './validators' );
const strings = require( './strings' );

const FILTERS = Object.entries( {
	country: validators.isCountryOrAdminArea,
	sector: validators.isSector,
	type: validators.isBarrierType,
	priority: validators.isBarrierPriority,
	region: validators.isOverseasRegion,
	search: ( str ) => !!str.length,
} );

const filterStringMap = {
	country: strings.locations,
	sector: strings.sectors,
	type: strings.types,
	priority: strings.priorities,
	region: strings.regions
};

module.exports = {

	FILTERS,

	transformFilterValue: function( key, value ) {

		const stringFn = filterStringMap[ key ];

		return ( stringFn ? stringFn( value ) : value );
	},

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

