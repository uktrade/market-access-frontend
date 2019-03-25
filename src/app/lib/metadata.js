const backend = require( './backend-request' );

let countries;
let adminAreasByCountry;
let adminAreas;
let overseasRegions;
let sectors;
let level0Sectors;
let barrierTypes;
let uniqueBarrierTypes;
let barrierPriorities;

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

	let alteredAdminAreas = {};

	// Loop through each admin area and push it to the corresponding 
	// array based on country ID 
	adminAreas.forEach( ( countryAdminArea ) => {
		// Key already exists for country
		if (countryAdminArea.country.id in alteredAdminAreas) {
			alteredAdminAreas[countryAdminArea.country.id].push(countryAdminArea);
		// Key does not exist for country
		} else {
			alteredAdminAreas[countryAdminArea.country.id] = [];
			alteredAdminAreas[countryAdminArea.country.id].push(countryAdminArea);
		}
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
}

function createAdminAreaList (country, adminAreas, text) {
	const adminAreaList = adminAreas[country].map( ( adminArea ) => ( {
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
		modifyer: priority.code.toLowerCase()
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
			adminAreasByCountry = alterAdminAreasData(body.country_admin_areas);
			countries = availableCountries.map( cleanCountry );
			sectors = body.sectors.filter( notDisabled );
			level0Sectors = sectors.filter( ( sector ) => sector.level === 0 );
			barrierTypes = body.barrier_types;
			uniqueBarrierTypes = dedupeBarrierTypes( barrierTypes );
			barrierPriorities = body.barrier_priorities.map( barrierPriority ).sort( sortPriority );

			module.exports.statusTypes = {
				...body.status_types,
				'1': 'A procedural/short-term barrier',
				'2': 'A long term strategic barrier'
			};
			module.exports.lossScale = body.loss_range;
			module.exports.optionalBool = body.adv_boolean;
			module.exports.countries = countries;
			module.exports.adminAreas = adminAreas;
			module.exports.overseasRegions = overseasRegions;
			module.exports.govResponse = body.govt_response;
			module.exports.publishResponse = body.publish_response;
			module.exports.reportStages = body.report_stages;
			module.exports.reportTaskList = createTaskList( body.report_stages );
			module.exports.barrierTypes = barrierTypes;
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

const OPEN = 2;
const RESOLVED = 4;
const HIBERNATED = 5;

module.exports.getCountryAdminAreasList = ( countryID, defaultText = 'Select an admin area') => createAdminAreaList(countryID, adminAreasByCountry, defaultText);
module.exports.isCountryWithAdminArea = ( countryID ) => countryID in adminAreasByCountry;
module.exports.getAdminArea = (adminAreaId) => adminAreas.find( ( AdminArea ) => AdminArea.id === adminAreaId );

module.exports.barrier = {
	status: {
		types: {
			OPEN,
			RESOLVED,
			HIBERNATED
		},
		typeInfo: {
			[ OPEN ]: { name: 'Open', modifyer: 'assessment' },
			[ RESOLVED ]: { name: 'Resolved', modifyer: 'resolved' },
			[ HIBERNATED ]: { name: 'Paused', modifyer: 'hibernated' }
		}
	}
};

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
