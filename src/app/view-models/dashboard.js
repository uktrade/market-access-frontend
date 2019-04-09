const metadata = require( '../lib/metadata' );

const barrierStatusTypeInfo = metadata.barrier.status.typeInfo;

const checkAllSectors = (barrier) => barrier.all_sectors ? 'All Sectors' : ( barrier.sectors && barrier.sectors.map( getSector ) || [ 'Unknown' ] );

function getSector( sectorId ){

	const sector = metadata.getSector( sectorId );

	return ( sector && sector.name );
}

function update( barrier ){

	barrier.all_sectors = true;
	const countryId = barrier.export_country;
	const country = metadata.countries.find( ( country ) => country.id === countryId );
	const barrierStatusCode = barrier.current_status.status;
	const status = barrierStatusTypeInfo[ barrierStatusCode ] || {};
	const priority = {
		...barrier.priority,
		modifyer: barrier.priority.code.toLowerCase(),
	};

	return {
		id: barrier.id,
		code: barrier.code,
		title: barrier.barrier_title,
		country: {
			id: countryId,
			name: ( country && country.name )
		},
		sectors: checkAllSectors(barrier),
		supportNeeded: barrier.support_type === 1,
		hasContributors: barrier.contributor_count > 0,
		problemStatus: metadata.statusTypes[ barrier.problem_status ],
		status,
		priority,
		date: {
			reported: barrier.reported_on,
			created: barrier.created_on
		},
	};
}

module.exports = ( barriers, country ) => {

	if( barriers && barriers.length ){

		barriers = barriers.map( update );
	}

	return {	barriers, country	};
};
