const config = require( '../config' );
const metadata = require( './metadata' );
const uuid = /^[a-zA-Z0-9-]+$/;
const isNumeric = /^[0-9]+$/;

function isCountry( id ){
	return metadata.countries.some( ( country ) => country.id === id );
}

function isCountryAdminArea( id ){
	return metadata.adminAreas.some( ( adminArea ) => adminArea.id === id );
}

module.exports = {
	isNumeric: ( value ) => isNumeric.test( value ),
	isDefined: ( value ) => {

		const type = ( typeof value );
		const isDefined = ( type !== 'undefined' );
		const isString = ( isDefined && type === 'string' );

		if( isString ){ return value.trim().length > 0; }
		return isDefined;
	},
	isUuid: ( id ) => uuid.test( id ),
	isMetadata: ( key ) => ( value ) => Object.keys( metadata[ key ] ).includes( value ),
	isCountry,
	isOverseasRegion: ( id ) => metadata.overseasRegions.some( ( region ) => region.id === id ),
	isCountryAdminArea,
	isSector: ( id ) => metadata.sectors.some( ( sector ) => sector.id === id ),
	isOneBoolCheckboxChecked: ( values ) => {

		for( let value of Object.values( values ) ){

			if( value === 'true' ){
				return true;
			}
		}

		return false;
	},
	isBarrierType: ( id ) => metadata.barrierTypes.some( ( barrier ) => barrier.id == id ),
	isDateValue: ( key ) => ( values ) => !!values[ key ],
	isDateValid: ( values ) => !!Date.parse( [ values.year, values.month, values.day ].join( '-' ) ),
	isDateInPast: ( values ) => ( Date.parse( [ values.year, values.month, values.day ].join( '-' ) ) < Date.now() ),
	isDateNumeric: ( values ) => {

		const allValues = Object.values( values ).reduce( ( str, value ) => ( str + value ), '' );

		return isNumeric.test( allValues );
	},
	isValidFile: ( file ) => config.files.types.includes( file.type ),
	isBarrierPriority: ( value ) => metadata.barrierPriorities.some( ( priority ) => priority.code === value ),
	isCountryOrAdminArea: ( id ) => isCountry( id ) || isCountryAdminArea( id ),
};
