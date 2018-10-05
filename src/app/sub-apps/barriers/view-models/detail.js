const metadata = require( '../../../lib/metadata' );

const OPEN = 2;
const RESOLVED = 4;
const HIBERNATED = 5;

const barrierStatus = {
	[ OPEN ]: { name: 'Open', modifyer: 'assessment' },
	[ RESOLVED ]: { name: 'Resolved', modifyer: 'resolved' },
	[ HIBERNATED ]: { name: 'Paused', modifyer: 'hibernated' }
};

function getBarrierType( type ){

	if( !type ){ return type; }

	const { id, title, description, category } = type;

	return {
		id,
		title,
		description,
		category: {
			id: category,
			name: metadata.barrierTypeCategories[ category ]
		}
	};
}

module.exports = ( barrier ) => {

	const barrierStatusCode = barrier.current_status.status;
	const sectors = ( barrier.sectors || [] ).map( metadata.getSector );
	const status = barrierStatus[ barrierStatusCode ] || {};
	const sectorsList = sectors.map( ( sector ) => (sector && { text: sector.name } || { text: 'Unknown' } ) );

	status.description = barrier.current_status.status_summary;
	status.date = barrier.current_status.status_date;

	return {
		barrier: {
			id: barrier.id,
			isOpen: ( barrierStatusCode === OPEN ),
			isResolved: ( barrierStatusCode === RESOLVED ),
			isHibernated: ( barrierStatusCode === HIBERNATED ),
			title: barrier.barrier_title,
			product: barrier.product,
			problem: {
				status: metadata.statusTypes[ barrier.problem_status ],
				description: barrier.problem_description
			},
			type: getBarrierType( barrier.barrier_type ),
			status,
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
		sectorsList
	};
};
