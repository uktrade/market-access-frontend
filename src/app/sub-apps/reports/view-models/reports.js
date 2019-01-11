const metadata = require( '../../../lib/metadata' );

function update( item ){

	const id = item.problem_status;

	item.isResolved = item.is_resolved;
	item.country = metadata.getCountry( item.export_country );
	item.problem_status = {
		id,
		name: metadata.statusTypes[ id ],
	};
	item.date = {
		created: item.created_on
	};

	return item;
}

function sortDescending( a, b ){

	const aDate = Date.parse( a.date.created );
	const bDate = Date.parse( b.date.created );

	return ( aDate === bDate ? 0 : ( aDate > bDate ? -1 : 1 ) );
}

module.exports = ( reports, country ) => {

	if( reports && reports.length ){

		reports = reports.map( update );
	}

	reports.sort( sortDescending );

	return {	reports, country };
};
