const metadata = require( '../lib/metadata' );
const sortGovukItems = require( '../lib/sort-govuk-items' );

const { OPEN, RESOLVED, HIBERNATED } = metadata.barrier.status.types;
const barrierStatusTypeInfo = metadata.barrier.status.typeInfo;

function isSelected( value ){

	return ( item ) => {

		// need to use Abstract Equality Comparison
		// query params are always strings so ensure they match numbers etc
		if( item.value == value ){

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
			code: barrier.code,
			title: barrier.barrier_title,
			isOpen: ( barrierStatusCode === OPEN ),
			isResolved: ( barrierStatusCode === RESOLVED ),
			isHibernated: ( barrierStatusCode === HIBERNATED ),
			country: metadata.getCountry( barrier.export_country ),
			sectors,
			sectorsList: sectors.map( ( sector ) => sector.name ),
			status,
			date: {
				reported: barrier.reported_on,
				status: barrier.current_status.status_date,
				created: barrier.created_on,
			}
		} );
	}

	return {
		count,
		barriers: barrierList,
		hasFilters: !!Object.keys( filters ).length,
		filters: {
			country: metadata.getCountryList( 'All locations' ).map( isSelected( filters.country ) ),
			sector: metadata.getSectorList( 'All sectors' ).map( isSelected( filters.sector ) ),
			type: metadata.getBarrierTypeList().sort( sortGovukItems.alphabetical ).map( isSelected( filters.type ) ),
		}
	};
};
