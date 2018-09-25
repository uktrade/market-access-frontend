const metadata = require( '../../../lib/metadata' );

const barrierStatus = {
	2: { name: 'Open', modifyer: 'assessment' },
	4: { name: 'Resolved', modifyer: 'resolved' },
	5: { name: 'Hibernated', modifyer: 'hibernated' }
};

module.exports = ( barrier ) => {

	const barrierStatusCode = barrier.current_status.status;
	const sectors = ( barrier.sectors || [] ).map( metadata.getSector );

	return {
		barrier: {
			id: barrier.id,
			title: barrier.barrier_title,
			product: barrier.product,
			problem: {
				status: metadata.statusTypes[ barrier.problem_status ],
				description: barrier.problem_description
			},
			type: barrier.barrier_type,
			status: barrierStatus[ barrierStatusCode ],
			reportedOn: barrier.reported_on,
			reportedBy: barrier.reported_by,
			country: metadata.getCountry( barrier.export_country ),
			sectors,
			source: {
				id: barrier.source,
				name: metadata.barrierAwareness[ barrier.source ],
				description: barrier.other_source
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
		},
		sectorsList: sectors.map( ( sector ) => (sector && { text: sector.name } || {}) )
	};
};
