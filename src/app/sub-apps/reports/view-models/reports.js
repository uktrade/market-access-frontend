const metadata = require( '../../../lib/metadata' );
const { RESOLVED } = metadata.barrier.status.types;

function update( item ){

	item.resolvedText = ( item.is_resolved ? ( item.resolved_status == RESOLVED ? 'In full' : 'In part' ) : 'No' );
	item.country = metadata.getCountry( item.export_country );
	item.problemStatusText = metadata.statusTypes[ item.problem_status ];
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

					currentReport = report;
					return true;
				}
			});
		}
	}

	return { reports, currentReport };
};
