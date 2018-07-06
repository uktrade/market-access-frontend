const metadata = require( './metadata' );

module.exports = {
	isDefined: ( value ) => {

		const type = ( typeof value );
		const isDefined = ( type !== 'undefined' );
		const isString = ( isDefined && type === 'string' );

		if( isString ){ return value.length > 0; }
		return isDefined;
	},
	isUuid: ( value ) => /^[a-zA-Z0-9-]+$/.test( value ),
	isMetadata: ( key ) => ( value ) => Object.keys( metadata[ key ] ).includes( value ),
	isCountry: ( value ) => metadata.countries.some( ( country ) => country.id === value ),
	isOneBoolCheckboxChecked: ( values ) => {

		for( let [ /* key */, value ] of Object.entries( values ) ){

			if( value === 'true' ){
				return true;
			}
		}

		return false;
	}
};
