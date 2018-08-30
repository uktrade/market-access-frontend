const backend = require( './backend-service' );

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

module.exports.fetch = async () => {

	try {

		const { response, body } = await backend.getMetadata();

		if( response.isSuccess ){

			module.exports.statusTypes = body.status_types;
			module.exports.lossScale = body.loss_range;
			module.exports.boolScale = body.adv_boolean;
			module.exports.countries = body.countries.filter( notDisabled ).map( cleanCountry );
			module.exports.govResponse = body.govt_response;
			module.exports.publishResponse = body.publish_response;
			module.exports.reportStages = body.report_stages;
			module.exports.reportTaskList = createTaskList( body.report_stages );
			module.exports.barrierTypes = body.barrier_types;
			module.exports.barrierTypeCategories = body.barrier_type_categories;
			module.exports.supportType = body.support_type;
			module.exports.bool = {
				'true': 'Yes',
				'false': 'No'
			};
			module.exports.barrierAwareness = {
				'1': 'Company',
				'2': 'Trade association',
				'3': 'Government entity',
				'4': 'Other'
			};

		} else {

			throw new Error( 'Unable to fetch metadata' );
		}

	} catch( e ){

		throw e;
	}
};
