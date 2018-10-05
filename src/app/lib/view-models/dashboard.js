const metadata = require( '../metadata' );

function getSector( sectorId ){

	const sector = metadata.getSector( sectorId );

	return ( sector && sector.name );
}

function update( item ){

	const countryId = item.export_country;
	const country = metadata.countries.find( ( country ) => country.id === countryId );

	item.country = {
		id: countryId,
		name: ( country && country.name )
	};

	item.sectors = ( item.sectors && item.sectors.map( getSector ) || [ 'Unknown' ] );
	item.resolved = ( item.current_status && item.current_status.status ) === 4;
	item.supportNeeded = item.support_type === 1;
	item.hasContributors = item.contributor_count > 0;
	item.problemStatus = metadata.statusTypes[ item.problem_status ];

	return item;
}

module.exports = ( barriers, country ) => {

	if( barriers && barriers.length ){

		barriers = barriers.map( update );

		barriers.sort( ( a, b ) => {

			const aDate = Date.parse( a.reported_on );
			const bDate = Date.parse( b.reported_on );

			return ( aDate === bDate ? 0 : ( aDate < bDate ? -1 : 1 ) );
		} );
	}

	return {	barriers, country	};
};
