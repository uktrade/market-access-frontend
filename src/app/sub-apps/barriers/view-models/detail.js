const metadata = require( '../../../lib/metadata' );

const barrierStatus = {
	2: { name: 'Open', modifyer: 'assessment' },
	4: { name: 'Resolved', modifyer: 'resolved' },
	5: { name: 'Hibernated', modifyer: 'hibernated' }
};

module.exports = ( barrier ) => {

	const report = barrier.report;
	const barrierStatusCode = barrier.current_status.status;
	const company = report.company;

	return {
		barrier: {
			id: barrier.id,
			title: report.barrier_title,
			summary: barrier.summary,
			type: barrier.barrier_type,
			status: barrierStatus[ barrierStatusCode ],
			reportedOn: barrier.reported_on,
			company,
			country: metadata.countries.find( ( country ) => country.id === report.export_country ),
			sector: {
				id: company.sector_id,
				name: company.sector_name
			},
			legal: {
				hasInfringements: ( barrier.has_legal_infringement == '1' ),
				unknownInfringements: ( barrier.has_legal_infringement == '3' ),
				infringements: {
					wto: barrier.wto_infringement,
					fta: barrier.fta_infringement,
					other: barrier.other_infringement
				},
				summary: barrier.infringement_summary
			}
		}
	};
};
