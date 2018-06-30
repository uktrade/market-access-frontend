const metadata = require( './metadata' );

module.exports = {
	isDefined: ( value ) => {

		const type = ( typeof value );
		const isDefined = ( type !== 'undefined' );
		const isString = ( isDefined && type === 'string' );

		if( isString ){ return value.length > 0; }
		return isDefined;
	},
	isUuid: ( value ) => /^[a-zA-Z-]+$/.test( value ),
	isMetadata: ( key ) => ( value ) => Object.keys( metadata[ key ] ).includes( value ),
	isCountry: ( value ) => metadata.countries.some( ( country ) => country.id === value )
};
