const metadata = require( '../lib/metadata' );

const barrierStatusTypeInfo = metadata.barrier.status.typeInfo;

function getSector( sectorId ){

	const sector = metadata.getSector( sectorId );

	return ( sector && sector.name );
}

function update( barrier ){

	const countryId = barrier.export_country;
	const country = metadata.countries.find( ( country ) => country.id === countryId );
	const barrierStatusCode = barrier.current_status.status;
	const status = barrierStatusTypeInfo[ barrierStatusCode ] || {};

	return {
		id: barrier.id,
		code: barrier.code,
		title: barrier.barrier_title,
		country: {
			id: countryId,
			name: ( country && country.name )
		},
		sectors: ( barrier.sectors && barrier.sectors.map( getSector ) || [ 'Unknown' ] ),
		supportNeeded: barrier.support_type === 1,
		hasContributors: barrier.contributor_count > 0,
		problemStatus: metadata.statusTypes[ barrier.problem_status ],
		status,
		date: {
			reported: barrier.reported_on
		},
	};
}

function sortDescending( a, b ){

	const aDate = Date.parse( a.date.reported );
	const bDate = Date.parse( b.date.reported );

	return ( aDate === bDate ? 0 : ( aDate > bDate ? -1 : 1 ) );
}

module.exports = ( barriers, country ) => {

	if( barriers && barriers.length ){

		barriers = barriers.map( update );

		barriers.sort( sortDescending );
	}

	return {	barriers, country	};
};
