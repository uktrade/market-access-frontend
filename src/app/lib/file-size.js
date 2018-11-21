module.exports = function fileSize( input ){

	const base = 1024;
	const bytes = parseFloat(input);
	const units = [
		'Bytes',
		'kB',
		'MB',
		'GB',
		'TB',
		'PB',
		'EB',
		'ZB',
		'YB'
	];

	if( bytes === 1 ){

		return '1 Byte';

	} else if( bytes < base ){

		return bytes + ' Bytes';

	} else {

		return units.reduce( ( match, unit, index ) => {

			const size = Math.pow( base, index );

			if( bytes >= size ){

				const value = ( bytes / size ).toFixed( 1 );
				const hasTrailingZero = ( value.substr( -2 ) === '.0' );

				return ( hasTrailingZero ? parseInt( value, 10 ) : value ) + ' ' + unit;
			}

			return match;
		});
	}
};
