const backend = require( './backend-request' );

function notDisabled( item ){

	return  item.disabled_on === null;
}

function cleanCountry( item ){

	return {
		id: item.id,
		name: item.name
	};
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

function createCountryList( countries, text ){

	const countryList = countries.map( ( country ) => ( {
		value: country.id,
		text: country.name
	} ) );

	countryList.unshift( { value: '', text } );

	return countryList;
}

function createSectorsList( sectors, text ){

	const sectorList = sectors.map( ( sector ) => ( {
		value: sector.id,
		text: sector.name
	} ) );

	sectorList.unshift( { value: '', text } );

	return sectorList;
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

	if( orderA === orderB ){ return 0; }

	return ( orderA > orderB ? 1 : -1 );
}

function barrierPriority( priority ){

	return {
		...priority,
		modifyer: priority.code.toLowerCase()
	};
}

let countries;
let sectors;
let level0Sectors;
let barrierTypes;
let uniqueBarrierTypes;
let barrierPriorities;

module.exports.fetch = async () => {

	try {

		const { response, body } = await backend.get( '/metadata' );

		if( response.isSuccess ){

			countries = body.countries.filter( notDisabled ).map( cleanCountry );
			sectors = body.sectors.filter( notDisabled );
			level0Sectors = sectors.filter( ( sector ) => sector.level === 0 );
			barrierTypes = body.barrier_types;
			uniqueBarrierTypes = dedupeBarrierTypes( barrierTypes );
			barrierPriorities = body.barrier_priorities.map( barrierPriority ).sort( sortPriority );

			module.exports.statusTypes = body.status_types;
			module.exports.lossScale = body.loss_range;
			module.exports.boolScale = body.adv_boolean;
			module.exports.countries = countries;
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

module.exports.getCountryList = ( defaultText = 'Choose a country' ) => createCountryList( countries, defaultText );
module.exports.getSectorList = ( defaultText = 'Select a sector' ) => createSectorsList( level0Sectors, defaultText );
module.exports.getSector = ( sectorId ) => sectors.find( ( sector ) => sector.id === sectorId );
module.exports.getCountry = ( countryId ) => countries.find( ( country ) => country.id === countryId );

module.exports.getBarrierTypeList = () => {

	const list = uniqueBarrierTypes.map( ( { id, title } ) => ({ value: id, text: title }) );

	list.unshift( { value: '', text: 'All barrier types' } );

	return list;
};

module.exports.getBarrierPrioritiesList = () => barrierPriorities.map( ( { code, name } ) => ({
	value: code,
	html: `<span class="priority-marker priority-marker--${ code.toLowerCase() }"></span><strong>${ name }</strong> priority`
}) );

const OPEN = 2;
const RESOLVED = 4;
const HIBERNATED = 5;

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
