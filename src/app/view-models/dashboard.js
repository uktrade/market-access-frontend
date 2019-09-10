const metadata = require( '../lib/metadata' );
const urls = require( '../lib/urls' );
const pagination = require( '../lib/pagination' );
const config = require( '../config' );

const RESULTS_LIMIT = config.backend.resultsLimit;
const barrierStatusTypeInfo = metadata.barrier.status.typeInfo;

function getSector( sectorId ){

	const sector = metadata.getSector( sectorId );

	return ( sector && sector.name );
}

function update( barrier ){

	const countryId = barrier.export_country;
	const country = metadata.countries.find( ( country ) => country.id === countryId );
	const barrierStatusCode = barrier.status.id;
	const status = barrierStatusTypeInfo[ barrierStatusCode ] || {};
	const priority = {
		...barrier.priority,
		modifier: barrier.priority.code.toLowerCase(),
	};

	return {
		id: barrier.id,
		code: barrier.code,
		title: barrier.barrier_title,
		country: {
			id: countryId,
			name: ( country && country.name )
		},
		sectors: ( barrier.all_sectors ? [ 'All sectors' ] : barrier.sectors && barrier.sectors.map( getSector ) || [ 'Unknown' ] ),
		supportNeeded: barrier.support_type === 1,
		hasContributors: barrier.contributor_count > 0,
		problemStatus: metadata.statusTypes[ barrier.problem_status ],
		status,
		priority,
		date: {
			reported: barrier.reported_on,
			created: barrier.created_on,
			modified: barrier.modified_on,
		},
	};
}

function getSortableFields( watchListIndex, sortData ){

	const sortableFields = {};
	const currentSort = sortData.currentSort;

	sortData.fields.forEach( ( field ) => {

		const isActive = ( field === currentSort.field );

		sortableFields[ field ] = {
			isActive,
			key: field,
			direction: ( isActive ? currentSort.direction : 'desc' ),
			url: urls.index( watchListIndex, { sortBy: field, sortDirection: ( isActive ? ( currentSort.direction === 'asc' ? 'desc' : 'asc' ) : 'desc' ) } ),
		};
	} );

	return sortableFields;
}

module.exports = ( { count, results: barriers }, page, sortData, filters, watchListIndex, queryString, locals ) => {

	if( barriers && barriers.length ){

		barriers = barriers.map( update );
	}

	const editQueryString = { ...filters, editList: watchListIndex };
	const sortableFields = getSortableFields( watchListIndex, sortData, page );

	return {
		...locals,
		barriers,
		paginationData: pagination.create( queryString, RESULTS_LIMIT, count, page ),
		sortableFields,
		barrierCount: count,
		editQueryString,
		watchListIndex,
	};
};
