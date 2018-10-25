const metadata = require( '../lib/metadata' );

const barrierStatusTypeInfo = metadata.barrier.status.typeInfo;

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

		const sectors = ( barrier.sectors && barrier.sectors.map( metadata.getSector ) || [] );
		const barrierStatusCode = barrier.current_status.status;
		const status = barrierStatusTypeInfo[ barrierStatusCode ] || {};

		barrierList.push( {
			id: barrier.id,
			name: barrier.barrier_title,
			country: metadata.getCountry( barrier.export_country ),
			sectors,
			sectorsList: sectors.map( ( sector ) => sector.name ),
			status,
			date: {
				reported: barrier.reported_on
			}
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
