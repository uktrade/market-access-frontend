const metadata = require( '../../../lib/metadata' );

function update( item ){

	const id = item.problem_status;

	item.isResolved = item.is_resolved;
	item.country = metadata.getCountry( item.export_country );
	item.problem_status = {
		id,
		name: metadata.statusTypes[ id ],
	};

	return item;
}

function sortAscending( a, b ){

	const aDate = Date.parse( a.created_on );
	const bDate = Date.parse( b.created_on );

	return ( aDate === bDate ? 0 : ( aDate > bDate ? -1 : 1 ) );
}

module.exports = ( reports, country ) => {

	if( reports && reports.length ){

		reports = reports.map( update );
	}

	reports.sort( sortAscending );

	return {	reports, country };
};
