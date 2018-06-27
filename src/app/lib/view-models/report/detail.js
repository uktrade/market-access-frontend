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

function addReportData( tasks, report ){

	const reportProgress = getProgress( report.progress );
	let addedFirstNotStarted = false;

	for( let task of tasks ){

		for( let subTask of task.items ){

			const reportStage = reportProgress[ subTask.stage ];

			subTask.inProgress = ( reportStage == 2 ),
			subTask.complete = ( reportStage == 3 );

			if( !addedFirstNotStarted && !subTask.complete && !subTask.inProgress ){
				subTask.notStarted = true;
				addedFirstNotStarted = true;
			}

			if( subTask.complete || subTask.notStarted ){
				subTask.href = urls.reportStage( subTask.stage, report );
			}
		}
	}
}


module.exports = ( report ) => {

	//copy tasks before we mutate
	const tasks = JSON.parse( JSON.stringify( metadata.reportTaskList ) );

	addReportData( tasks, report );
	//console.log( JSON.stringify( tasks, null, 2 ) );

	return { tasks };
};
