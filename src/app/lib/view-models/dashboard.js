const metadata = require( '../metadata' );

function updateStatus( item ){

	const id = item.problem_status;

	item.problem_status = {
		id,
		name: metadata.statusTypes[ id ],
		isEmergency: item.is_emergency
	};

	return item;
}

module.exports = ( barriers ) => {

	if( barriers && barriers.length ){

		barriers = barriers.map( updateStatus );
	}

	return {	barriers	};
};
