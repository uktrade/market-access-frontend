const metadata = require( '../../../lib/metadata' );

const barrierStatus = {
	2: { name: 'Assessment', modifyer: 'assessment' },
	4: { name: 'Resolved', modifyer: 'resolved' }
};

module.exports = ( barrier ) => {

	const report = barrier.report;
	const barrierStatusCode = barrier.current_status.status;
	const company = report.company;

	return {
		barrier: {
			title: report && report.barrier_title,
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
			impact: {
				loss: metadata.lossScale[ barrier.estimated_loss_range ],
				summary: barrier.impact_summary,
				companiesAffected: metadata.boolScale[ barrier.other_companies_affected ]
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
