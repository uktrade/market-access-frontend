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

module.exports = ( reports ) => {

	if( reports && reports.length ){

		reports = reports.map( updateStatus );
	}

	reports.sort( ( a, b ) => {

		const aDate = Date.parse( a.created_on );
		const bDate = Date.parse( b.created_on );

		return ( aDate === bDate ? 0 : ( aDate < bDate ? -1 : 1 ) );
	} );

	return {	reports	};
};
