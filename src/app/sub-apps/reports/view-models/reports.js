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

module.exports = ( reports, currentReportId ) => {

	let currentReport;

	if( reports && reports.length ){

		reports = reports.map( update );

		if( currentReportId ){

			reports.some( ( report ) => {
				if( report.id === currentReportId ){
					return currentReport = report;
				}
			});
		}
	}

	return { reports, currentReport };
};
