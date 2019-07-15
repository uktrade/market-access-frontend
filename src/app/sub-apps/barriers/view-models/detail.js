const metadata = require( '../../../lib/metadata' );
const strings = require( '../../../lib/strings' );

const { OPEN, RESOLVED, HIBERNATED } = metadata.barrier.status.types;
const barrierStatusTypeInfo = metadata.barrier.status.typeInfo;

module.exports = ( barrier, addCompany = false ) => {

	const barrierStatusCode = barrier.status;
	const status = barrierStatusTypeInfo[ barrierStatusCode ] || {};
	const sectors = ( barrier.sectors || [] ).map( metadata.getSector );
	const sectorsList =  barrier.all_sectors ? [{ text: 'All sectors' }] : sectors.map( ( sector ) => ( sector && { text: sector.name } || { text: 'Unknown' } ) );
	const companies = barrier.companies || [];
	const companiesList = companies.map( ( company ) => ( { text: company.name } ) );
	const barrierTypes = ( barrier.barrier_types || [] );

	function getEuExitRelatedText( code ){

		return ( code ? metadata.optionalBool[ code ] : 'Unknown' );
	}

	status.description = barrier.status_summary;
	status.date = barrier.status_date;

	return {
		addCompany,
		barrier: {
			id: barrier.id,
			code: barrier.code,
			isOpen: ( barrierStatusCode === OPEN ),
			isResolved: ( barrierStatusCode === RESOLVED ),
			isHibernated: ( barrierStatusCode === HIBERNATED ),
			title: barrier.barrier_title,
			product: barrier.product,
			problem: {
				status: metadata.statusTypes[ barrier.problem_status ],
				description: barrier.problem_description
			},
			types: barrierTypes.map( metadata.getBarrierType ).map( ( type = {} ) => ({ text: type.title }) ),
			status,
			reportedOn: barrier.reported_on,
			addedBy: barrier.reported_by,
			euExitRelated: getEuExitRelatedText( barrier.eu_exit_related ),
			location: strings.location( barrier.export_country, barrier.country_admin_areas ),
			sectors,
			source: {
				id: barrier.source,
				name: metadata.barrierSource[ barrier.source ],
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
			},
			priority: {
				...barrier.priority,
				modifier: barrier.priority.code.toLowerCase()
			},
			modifiedOn: barrier.modified_on
		},
		sectorsList,
		companies,
		companiesList,
	};
};
