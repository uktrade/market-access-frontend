const backend = require( './backend-request' );
const govukItemsFromObject = require( './govuk-items-from-object' );

let countries;
let adminAreasByCountry;
let adminAreas;
let overseasRegions;
let sectors;
let level0Sectors;
let barrierTypes;
let uniqueBarrierTypes;
let barrierPriorities;
let barrierStatuses;

const barrierStatusKeys = {
	UNKNOWN: 7,
	PENDING: 1,
	OPEN: 2,
	PART_RESOLVED: 3,
	RESOLVED: 4,
	HIBERNATED: 5,
};

function notDisabled( item ){

	return  item.disabled_on === null;
}

function cleanCountry( item ){

	return {
		id: item.id,
		name: item.name
	};
}

// Groups the admin areas into seperate areas of objects relating to country
function alterAdminAreasData( adminAreas ) {

	const alteredAdminAreas = {};

	// Loop through each admin area and push it to the corresponding
	// array based on country ID

	adminAreas.forEach( ( countryAdminArea ) => {
		// Key already exists for country
		const countryId = countryAdminArea.country.id;
		const list = ( alteredAdminAreas[ countryId ] || [] );
		list.push( countryAdminArea );
		alteredAdminAreas[ countryId ] = list;
	} );

	return alteredAdminAreas;

}
function getOverseasRegions( countries ){

	const regions = {};

	for( let country of countries ){
		if( country.overseas_region ){
			regions[ country.overseas_region.id ] = country.overseas_region.name;
		}
	}

	return Object.entries( regions ).map( ( [ id, name ] ) => ({ id, name }) );
}

function addNumber( tasks ){

	for( let task of tasks ){

		task.number = ( task.items.length > 1 );
	}
}

function createTaskList( reportStages ){

	const tasks = [];

	for( let [ key, name ] of Object.entries( reportStages ) ){

		const stageParts = key.split( '.' );
		const mainStage = stageParts[ 0 ];
		const subStage = stageParts[ 1 ];
		const isParentStage = ( subStage === '0' );
		const taskIndex = ( Number( mainStage ) - 1 );

		if( isParentStage ) {

			tasks[ taskIndex ] = {
				stage: key,
				name: ( mainStage === '1' ? 'Add a barrier' : name ),
				items: []
			};

		} else {

			tasks[ taskIndex ].items.push( {
				stage: key,
				name
			} );
		}
	}

	addNumber( tasks );

	return tasks;
}

function createList( items, text ){

	const list = items.map( ( item ) => ( {
		value: item.id,
		text: item.name
	} ) );

	list.unshift( { value: '', text } );

	return list;
}

function createAdminAreaList( country, adminAreas, text ){

	const adminAreaList = adminAreas[ country ].map( ( adminArea ) => ( {
		value: adminArea.id,
		text: adminArea.name
	} ) );

	adminAreaList.unshift( { value: '', text } );

	return adminAreaList;
}

function dedupeBarrierTypes( barrierTypes ){

	const typeIds = [];
	const types = [];

	barrierTypes.forEach( ( type ) => {

		if( !typeIds.includes( type.id ) ){

			typeIds.push( type.id );
			types.push( type );
		}
	} );

	return types;
}

function sortPriority( { order: orderA }, { order: orderB } ){

	return ( orderA > orderB ? 1 : -1 );
}

function barrierPriority( priority ){

	return {
		...priority,
		modifier: priority.code.toLowerCase()
	};
}

function sortOverseasRegions( a, b ){
	return a.name.localeCompare( b.name );
}

module.exports.fetch = async () => {

	try {

		const { response, body } = await backend.get( '/metadata' );

		if( response.isSuccess ){

			const availableCountries = body.countries.filter( notDisabled );

			overseasRegions = getOverseasRegions( availableCountries ).sort( sortOverseasRegions );
			adminAreas = body.country_admin_areas.filter( notDisabled );
			adminAreasByCountry = alterAdminAreasData( adminAreas );
			countries = availableCountries.map( cleanCountry );
			sectors = body.sectors.filter( notDisabled );
			level0Sectors = sectors.filter( ( sector ) => sector.level === 0 );
			barrierTypes = body.barrier_types;
			uniqueBarrierTypes = dedupeBarrierTypes( barrierTypes );
			barrierPriorities = body.barrier_priorities.map( barrierPriority ).sort( sortPriority );
			barrierStatuses = Object.values( barrierStatusKeys ).reduce( ( statuses, id ) => {

				statuses[ id ] = body.barrier_status[ id ];
				return statuses;
			}, {} );

			module.exports.statusTypes = {
				...body.status_types,
				'1': 'A procedural, short-term barrier',
				'2': 'A long-term strategic barrier'
			};
			module.exports.lossScale = body.loss_range;
			module.exports.optionalBool = body.adv_boolean;
			module.exports.countries = countries;
			module.exports.adminAreas = adminAreas;
			module.exports.adminAreasByCountry = adminAreasByCountry;
			module.exports.overseasRegions = overseasRegions;
			module.exports.govResponse = body.govt_response;
			module.exports.publishResponse = body.publish_response;
			module.exports.reportStages = body.report_stages;
			module.exports.reportTaskList = createTaskList( body.report_stages );
			module.exports.barrierTypes = uniqueBarrierTypes;
			module.exports.barrierTypeCategories = body.barrier_type_categories;
			module.exports.supportType = body.support_type;
			module.exports.sectors = sectors;
			module.exports.level0Sectors = level0Sectors;
			module.exports.barrierSource = body.barrier_source;
			module.exports.barrierPriorities = barrierPriorities;
			module.exports.barrierPrioritiesMap = barrierPriorities.reduce( ( map, item ) => {

				map[ item.code ] = item;

				return map;
			}, {} );
			module.exports.bool = {
				'true': 'Yes',
				'false': 'No'
			};
			module.exports.documentStatus = {
				not_virus_scanned: 'Not virus scanned',
				virus_scanning_scheduled: 'Virus scanning scheduled',
				virus_scanning_in_progress: 'Virus scanning in progress',
				virus_scanning_failed: 'Virus scanning failed.',
				virus_scanned: 'Virus scanned',
				deletion_pending: 'Deletion pending',
			};
			module.exports.barrierStatuses = barrierStatuses;

			//overwrite static type info names with the names from the metadata
			for( let [ key, name ] of Object.entries( body.barrier_status ) ){

				const item = module.exports.barrier.status.typeInfo[ key ];

				if( item ){
					item.name = name;
				}
			}

			module.exports.barrierPendingOptions = body.barrier_pending;
			module.exports.barrierAssessmentImpactOptions = body.assessment_impact;

		} else {

			throw new Error( 'Unable to fetch metadata' );
		}

	} catch( e ){

		throw e;
	}
};

module.exports.getCountry = ( countryId ) => countries.find( ( country ) => country.id === countryId );
module.exports.getCountryList = ( defaultText = 'Choose a country' ) => createList( countries, defaultText );
module.exports.getOverseasRegion = ( id ) => overseasRegions.find( ( region ) => region.id === id );
module.exports.getOverseasRegionList = ( defaultText = 'Choose overseas region' ) => createList( overseasRegions, defaultText );
module.exports.getSector = ( sectorId ) => sectors.find( ( sector ) => sector.id === sectorId );
module.exports.getSectorList = ( defaultText = 'Select a sector' ) => createList( level0Sectors, defaultText );
module.exports.getBarrierType = ( typeId ) => uniqueBarrierTypes.find( ( type ) => type.id == typeId );
module.exports.getBarrierPriority = ( priorityCode ) => barrierPriorities.find( ( priority ) => priority.code == priorityCode );

module.exports.getBarrierTypeList = () => {

	const list = uniqueBarrierTypes.map( ( { id, title } ) => ({ value: id, text: title }) );

	list.unshift( { value: '', text: 'All barrier types' } );

	return list;
};

module.exports.getBarrierPrioritiesList = ( opts = {} ) => barrierPriorities.map( ( { code, name } ) => ({
	value: code,
	html: `<span class="priority-marker priority-marker--${ code.toLowerCase() }"></span>` + ( opts.suffix === false ? name : `<strong>${ name }</strong> priority` )
}) );

module.exports.getCountryAdminAreasList = ( countryId, defaultText = 'Select an admin area' ) => createAdminAreaList( countryId, adminAreasByCountry, defaultText );
module.exports.isCountryWithAdminArea = ( countryId ) => countryId in adminAreasByCountry;
module.exports.getAdminArea = ( adminAreaId ) => adminAreas.find( ( AdminArea ) => AdminArea.id === adminAreaId );

module.exports.getBarrierStatus = ( id ) => barrierStatuses[ id ];
module.exports.getBarrierStatusList = () => govukItemsFromObject( barrierStatuses );

module.exports.barrier = {
	status: {
		types: barrierStatusKeys,
		typeInfo: {
			[ barrierStatusKeys.UNKNOWN ]: { name: 'Unknown', modifier: 'hibernated', hint: 'Barrier requires further work for the status to be known' },
			[ barrierStatusKeys.PENDING ]: { name: 'Pending', modifier: 'assessment', hint: 'Barrier is awaiting action' },
			[ barrierStatusKeys.OPEN ]: { name: 'Open', modifier: 'assessment', hint: 'Barrier is being worked on' },
			[ barrierStatusKeys.PART_RESOLVED ]: { name: 'Part resolved', modifier: 'resolved', hint: 'Barrier impact has been significantly reduced but remains in part' },
			[ barrierStatusKeys.RESOLVED ]: { name: 'Resolved', modifier: 'resolved', hint: 'Barrier has been resolved for all UK companies' },
			[ barrierStatusKeys.HIBERNATED ]: { name: 'Paused', modifier: 'hibernated', hint: 'Barrier is present but not being pursued' },
		},
		pending: {
			OTHER: 'OTHER',
		},
	},
	priority: {
		codes: {
			UNKNOWN: 'UNKNOWN',
		}
	},
	createdBy: {
		items: {
			'1': 'My barriers',
			'2': 'My team barriers',
		}
	},
	assessment: {
		fieldNames: {
			impact: 'Economic assessment',
			value_to_economy: 'Value to UK Economy',
			import_market_size: 'Import Market Size',
			export_value: 'Value of currently affected UK exports',
			commercial_value: 'Commercial Value'
		}
	}
};

module.exports.getBarrierCreatedBy = ( id ) => module.exports.barrier.createdBy.items[ id ];
module.exports.getBarrierCreatedByList = () => govukItemsFromObject( module.exports.barrier.createdBy.items );

module.exports.mimeTypes = {
	'image/gif': '.gif',
	'image/png': '.png',
	'image/webp': '.webp',
	'image/jpeg': '.jpg',
	'text/csv': '.csv',
	'text/plain': '.txt',
	'application/rtf': '.rtf',
	'application/pdf': '.pdf',
	'application/vnd.oasis.opendocument.text': '.odt',
	'application/msword': '.doc',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
	'application/vnd.oasis.opendocument.presentation': '.odp',
	'application/vnd.ms-powerpoint': '.ppt',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
	'application/vnd.oasis.opendocument.spreadsheet': '.ods',
	'application/vnd.ms-excel': '.xls',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
};
