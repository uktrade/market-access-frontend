const metadata = require( '../lib/metadata' );
const sortGovukItems = require( '../lib/sort-govuk-items' );
const urls = require( '../lib/urls' );

const { OPEN, RESOLVED, HIBERNATED } = metadata.barrier.status.types;
const barrierStatusTypeInfo = metadata.barrier.status.typeInfo;

function createMatcher( key ){

	return function matcher( values = [] ){

		return ( item ) => {

			const value = String( item.value ); // query params are always strings so cast value to a string to ensure they match numbers etc

			if( values.includes( value ) ){ // .includes uses Same-value-zero equality matching

				item[ key ] = true;
			}

			return item;
		};
	};
}

function getRemoveUrl( filters, key ){

	const clone = { ...filters };

	delete clone[ key ];

	return urls.findABarrier( clone );
}

const isSelected = createMatcher( 'selected' );
const isChecked = createMatcher( 'checked' );

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
			priority: barrier.priority,
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
			country: {
				items: metadata.getCountryList( 'All locations' ).map( isChecked( filters.country ) ),
				active: filters.country && filters.country.map( metadata.getCountry ),
				removeUrl: getRemoveUrl( filters, 'country' ),
			},
			sector: {
				items: metadata.getSectorList( 'All sectors' ).map( isSelected( filters.sector ) ),
				active: filters.sector && filters.sector.map( metadata.getSector ),
				removeUrl: getRemoveUrl( filters, 'sector' ),
			},
			type: {
				items: metadata.getBarrierTypeList().sort( sortGovukItems.alphabetical ).map( isSelected( filters.type ) ),
				active: filters.type && filters.type.map( ( id ) => {

					const { title } = metadata.getBarrierType( id );

					return { name: title };
				} ),
				removeUrl: getRemoveUrl( filters, 'type' ),
			},
			priority: {
				items: metadata.getBarrierPrioritiesList( { suffix: false } ).map( isChecked( filters.priority ) ),
				active: filters.priority && filters.priority.map( metadata.getBarrierPriority ),
				removeUrl: getRemoveUrl( filters, 'priority' ),
			},
		}
	};
};
