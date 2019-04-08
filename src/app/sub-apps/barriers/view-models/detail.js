const metadata = require( '../../../lib/metadata' );

const { OPEN, RESOLVED, HIBERNATED } = metadata.barrier.status.types;
const barrierStatusTypeInfo = metadata.barrier.status.typeInfo;

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

function buildLocationString( country, adminAreas ){

	const countryName = ( metadata.getCountry( country ) || {} ).name;
	const adminAreasString = adminAreas ? adminAreas.map(
		(adminAreaId) => ( metadata.getAdminArea( adminAreaId ) || {} ).name
	).join( ', ' ) : '';

	return adminAreasString ? `${ adminAreasString } (${ countryName })` : countryName;
}

module.exports = ( barrier, addCompany = false ) => {

	const barrierStatusCode = barrier.status;
	const status = barrierStatusTypeInfo[ barrierStatusCode ] || {};
	const sectors = ( barrier.sectors || [] ).map( metadata.getSector );
	const sectorsList = sectors.map( ( sector ) => ( sector && { text: sector.name } || { text: 'Unknown' } ) );
	const companies = barrier.companies || [];
	const companiesList = companies.map( ( company ) => ( { text: company.name } ) );

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
				problemStatus: metadata.statusTypes[ barrier.problem_status ],
				description: barrier.problem_description
			},
			type: getBarrierType( barrier.barrier_type ),
			status,
			reportedOn: barrier.reported_on,
			addedBy: barrier.reported_by,
			euExitRelated: getEuExitRelatedText( barrier.eu_exit_related ),
			location: buildLocationString( barrier.export_country, barrier.country_admin_areas ),
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
				modifyer: barrier.priority.code.toLowerCase()
			},
			modifiedOn: barrier.modified_on
		},
		sectorsList,
		companies,
		companiesList,
	};
};
