const validators = require( './validators' );
const strings = require( './strings' );
const reporter = require( './reporter' );

const FILTERS = Object.entries( {
	country: [ 'Barrier location', validators.isCountryOrAdminArea, strings.locations ],
	sector: [ 'Sector', validators.isSector, strings.sectors ],
	type: [ 'Barrier type', validators.isBarrierType, strings.types ],
	priority: [ 'Barrier priority', validators.isBarrierPriority, strings.priorities ],
	region: [ 'Overseas region', validators.isOverseasRegion, strings.regions ],
	search: [ 'Search', ( str ) => !!str.length, ( str ) => str ],
	status: [ 'Barrier status', validators.isBarrierStatus, strings.statuses ],
} );

const displayMap = FILTERS.reduce( ( obj, [ key, [ label, , getValue ] ] ) => { obj[ key ] = { label, getValue }; return obj; }, {} );

function getDisplayInfo ( key, queryValue ){

	try {

		const { label, getValue } = displayMap[ key ];

		return { label, text: getValue( queryValue ) };

	} catch( e ){

		reporter.captureException( e );
	}
}

module.exports = {

	getDisplayInfo,

	createList: ( filters /* response from getFromQueryString */ ) => Object.entries( filters ).map( ( [ key, queryValue ] ) => {

		const { label, text } = getDisplayInfo( key, queryValue );

		return { key: label, value: text };
	} ),

	getFromQueryString: function( query ){

		const filters = {};

		for( let [ name, [ , validator ] ] of FILTERS ){

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
	},

	areEqual: ( list1, list2 ) => {

		const values1 = [];
		const values2 = [];

		FILTERS.forEach( ( [ key ] ) => {

			values1.push( list1[ key ] );
			values2.push( list2[ key ] );
		} );

		return JSON.stringify( values1 ) === JSON.stringify( values2 );
	},
};

