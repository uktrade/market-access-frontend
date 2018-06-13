const metadata = require( '../metadata' );

function updateStatus( item ){

	const id = item.problem_status;

	item.problem_status = {
		id,
		name: metadata.statusTypes[ id ],
		isEmergency: ( id === '1' || id === '2' )
	};

	return item;
}

module.exports = ( barriers ) => {

	if( barriers && barriers.length ){

		barriers = barriers.map( updateStatus );
	}

	return {	barriers	};
};
