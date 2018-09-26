const dateFormat = require( 'dateformat' );

const dayMonthYear = 'UTC:d mmmm yyyy';
const monthYear = 'UTC:mmmm yyyy';

module.exports = function( datestr, opts = {} ){

	const day = ( 'day' in opts ? opts.day : true );

	if( datestr ){

		try {

			return dateFormat( new Date( datestr ), ( day ? dayMonthYear : monthYear ) );

		} catch( e ){

			return '';
		}
	}
};
