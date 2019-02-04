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

module.exports = ( reports, country ) => {

	if( reports && reports.length ){

		reports = reports.map( update );
	}

	return {	reports, country };
};
