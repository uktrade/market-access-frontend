const metadata = require( '../../metadata' );
const urls = require( '../../urls' );

function getProgress( progress ){

	const r = {};

	if( progress ){

		for( let item of progress ){

			r[ item.stage_code ] = item.status_id;
		}
	}

	return r;
}

function createTasks( reportProgress ){

	const tasks = [];

	for( let [ key, name ] of Object.entries( metadata.reportStages ) ){

		const reportStage = reportProgress[ key ];
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
				name,
				inProgress: ( reportStage == 2 ),
				complete: ( reportStage == 3 )
			} );
		}
	}

	return tasks;
}

function addHref( tasks, report ){

	for( let task of tasks ){

		for( let subTask of task.items ){

			if( subTask.complete || subTask.notStarted ){
				subTask.href = urls.reportStage( subTask.stage, report );
			}
		}
	}
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
						name: 'Name and summarise the barrier'
					} );
				break;
				case '3.0':
					task.items.push( {
						name: 'Describe next steps and what type of support you might need'
					} );
				break;
			}
		}
	}
}

function addNext( tasks ){

	let items = [];

	for( let task of tasks ){

		items = items.concat( task.items );
	}

	for( let item of items ){
		if( !item.complete ){
			if( !item.inProgress ){
				item.notStarted = true;
				break;
			}
		}
	}
}

module.exports = ( report ) => {

	const reportProgress = getProgress( report.progress );
	const tasks = createTasks( reportProgress );

	addNumber( tasks );
	addMissingItems( tasks );
	addNext( tasks );
	addHref( tasks, report );

	//console.log( JSON.stringify( tasks, null, 2 ) );

	return { tasks };
};
