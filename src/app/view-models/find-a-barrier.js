const metadata = require( '../lib/metadata' );

function isSelected( value ){

	return ( item ) => {

		if( item.value === value ){

			item.selected = true;
		}

		return item;
	};
}

module.exports = function( params ){

	const { count, barriers, filters } = params;
	const barrierList = [];

	for( let barrier of barriers ){

		barrierList.push( {
			id: barrier.id,
			name: barrier.barrier_title,
			country: metadata.getCountry( barrier.export_country )
		} );
	}

	return {
		count,
		barriers: barrierList,
		filters: {
			country: metadata.getCountryList().map( isSelected( filters.country ) )
		}
	};
};
