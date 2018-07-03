const backend = require( './backend-service' );

function notDisabled( item ){

	return  item.disabled_on === null;
}

function addNumber( tasks ){

	for( let task of tasks ){

		task.number = ( task.items.length > 1 );
	}
}

function addMissingItems( tasks ){

	for( let task of tasks ){

		const hasItems = ( task.items.length > 0 );

		if( !hasItems ){

			switch( task.stage ){
				case '2.0':
					task.items.push( {
						name: 'Name and summarise the barrier',
						stage: task.stage
					} );
				break;
				case '3.0':
					task.items.push( {
						name: 'Describe next steps and what type of support you might need',
						stage: task.stage
					} );
				break;
			}
		}
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
	addMissingItems( tasks );

	return tasks;
}

module.exports.fetch = async () => {

	try {

		const { response, body } = await backend.getMetadata();

		if( response.isSuccess ){

			module.exports.statusTypes = body.status_types;
			module.exports.lossScale = body.loss_range;
			module.exports.boolScale = body.adv_boolean;
			module.exports.countries = body.countries.filter( notDisabled );
			module.exports.govResponse = body.govt_response;
			module.exports.publishResponse = body.publish_response;
			module.exports.reportStages = body.report_stages;
			module.exports.reportTaskList = createTaskList( body.report_stages );
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
