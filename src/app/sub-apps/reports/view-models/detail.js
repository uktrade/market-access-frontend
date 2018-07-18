const metadata = require( '../../../lib/metadata' );
const urls = require( '../../../lib/urls' );

function getProgress( progress ){

	const r = {};

	if( progress ){

		for( let item of progress ){

			r[ item.stage_code ] = item.status_id;
		}
	}

	return r;
}

function addReportData( tasks, report ){

	const reportProgress = getProgress( report.progress );
	//flatten each tasks items into one list
	const subTasks = tasks.reduce( ( list, task ) => list.concat( task.items ), [] );
	let hasInProgress = false;
	let nextTask;

	for( let subTask of subTasks ){

		const reportStage = reportProgress[ subTask.stage ];

		subTask.notStarted = ( reportStage == 1 );
		subTask.inProgress = ( reportStage == 2 ),
		subTask.complete = ( reportStage == 3 );

		if( !hasInProgress && subTask.inProgress ){
			hasInProgress = true;
			nextTask = subTask;
		}

		if( subTask.complete || subTask.inProgress ){
			subTask.href = urls.reportStage( subTask.stage, report );
		}
	}

	//if we don't have any subTasks in progress, then link to the first not started task
	if( !hasInProgress ){

		for( let subTask of subTasks ){
			if( subTask.notStarted ){
				subTask.href = urls.reportStage( subTask.stage, report );
				nextTask = subTask;
				break;
			}
		}
	}

	tasks.complete = subTasks.every( ( subTask ) => subTask.complete );
	tasks.next = nextTask;
}


module.exports = ( csrfToken, report ) => {

	//copy tasks before we mutate
	const tasks = JSON.parse( JSON.stringify( metadata.reportTaskList ) );

	addReportData( tasks, report );
	//console.log( JSON.stringify( tasks, null, 2 ) );

	return { csrfToken, tasks };
};
