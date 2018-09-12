const metadata = require( './metadata' );
const uuid = /^[a-zA-Z0-9-]+$/;

module.exports = {
	isDefined: ( value ) => {

		const type = ( typeof value );
		const isDefined = ( type !== 'undefined' );
		const isString = ( isDefined && type === 'string' );

		if( isString ){ return value.length > 0; }
		return isDefined;
	},
	isUuid: ( value ) => uuid.test( value ),
	isMetadata: ( key ) => ( value ) => Object.keys( metadata[ key ] ).includes( value ),
	isCountry: ( value ) => metadata.countries.some( ( country ) => country.id === value ),
	isSector: ( value ) => metadata.sectors.some( ( sector ) => sector.id === value ),
	isOneBoolCheckboxChecked: ( values ) => {

		for( let [ /* key */, value ] of Object.entries( values ) ){

			if( value === 'true' ){
				return true;
			}
		}

		return false;
	},
	isBarrierType: ( value ) => metadata.barrierTypes.some( ( barrier ) => barrier.id == value ),
	isDateValue: ( key ) => ( values ) => !!values[ key ],
	isDateValid: ( values ) => !!Date.parse( [ values.year, values.month, values.day ].join( '-' ) ),
	isDateInPast: ( values ) => ( Date.parse( [ values.year, values.month, values.day ].join( '-' ) ) < Date.now() )
};
