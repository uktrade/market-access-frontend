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
				name,
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

let countries;
let sectors;
let level0Sectors;

module.exports.fetch = async () => {

	try {

		const { response, body } = await backend.get( '/metadata' );

		if( response.isSuccess ){

			countries = body.countries.filter( notDisabled ).map( cleanCountry );
			sectors = body.sectors.filter( notDisabled );
			level0Sectors = sectors.filter( ( sector ) => sector.level === 0 );

			module.exports.statusTypes = body.status_types;
			module.exports.lossScale = body.loss_range;
			module.exports.boolScale = body.adv_boolean;
			module.exports.countries = countries;
			module.exports.govResponse = body.govt_response;
			module.exports.publishResponse = body.publish_response;
			module.exports.reportStages = body.report_stages;
			module.exports.reportTaskList = createTaskList( body.report_stages );
			module.exports.barrierTypes = body.barrier_types;
			module.exports.barrierTypeCategories = body.barrier_type_categories;
			module.exports.supportType = body.support_type;
			module.exports.sectors = sectors;
			module.exports.level0Sectors = level0Sectors;
			module.exports.barrierAwareness = body.barrier_source;
			module.exports.bool = {
				'true': 'Yes',
				'false': 'No'
			};

		} else {

			throw new Error( 'Unable to fetch metadata' );
		}

	} catch( e ){

		throw e;
	}
};

module.exports.getCountryList = () => createCountryList( countries, 'Choose a country' );
module.exports.getSectorList = () => createSectorsList( level0Sectors, 'Select a sector' );
module.exports.getSector = ( sectorId ) => sectors.find( ( sector ) => sector.id === sectorId );
module.exports.getCountry = ( countryId ) => countries.find( ( country ) => country.id === countryId );

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
