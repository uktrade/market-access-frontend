const metadata = require( '../metadata' );

function update( item ){

	const countryId = item.export_country;
	const country = metadata.countries.find( ( country ) => country.id === countryId );

	item.country = {
		id: countryId,
		name: ( country && country.name )
	};

	item.sectors = ( item.sectors || [ 'Unknown' ] );
	item.resolved = ( item.current_status && item.current_status.status ) === 4;
	item.supportNeeded = item.support_type === 1;
	item.hasContributors = item.contributor_count > 0;

	return item;
}

module.exports = ( barriers ) => {

	if( barriers && barriers.length ){

		barriers = barriers.map( update );

		barriers.sort( ( a, b ) => {

			const aDate = Date.parse( a.reported_on );
			const bDate = Date.parse( b.reported_on );

			return ( aDate === bDate ? 0 : ( aDate < bDate ? -1 : 1 ) );
		} );
	}

	return {	barriers	};
};
