module.exports = function getDateParts( dateStr ){

	if( dateStr ){

		const [ year, month, day ] = dateStr.split( '-' );

		return { year, month, day };
	}
};
