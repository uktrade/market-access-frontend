const metadata = require( '../../../lib/metadata' );

function getStatusType( id ){

	const typeInfo = metadata.barrier.status.typeInfo;

	if( id !== null && typeInfo.hasOwnProperty( id ) ){

		return typeInfo[ id ].name;
	}

	return  id;
}

function sortByDateDescending( a, b ){

	const aDate = Date.parse( a.date );
	const bDate = Date.parse( b.date );

	return ( aDate === bDate ? 0 : ( aDate > bDate ? -1 : 1 ) );
}

function getNotes( items, editId ){

	const notes = [];

	for( let item of items ){

		notes.push( {
			id: item.id,
			isNote: true,
			edit: ( item.id == editId ),
			date: item.created_on,
			text: item.text,
			user: item.created_by
		} );
	}

	return notes;
}

function getStatuses( items ){

	const statuses = [];

	for( let item of items ){

		statuses.push( {
			isStatus: true,
			date: item.date,
			event: item.event,
			state: {
				from: getStatusType( item.old_status ),
				to: getStatusType( item.new_status ),
				date: item.status_date,
				isResolved: ( item.new_status === metadata.barrier.status.types.RESOLVED )
			},
			text: item.status_summary,
			user: item.user,
		} );
	}

	return statuses;
}

module.exports = function ( responses, editId ){

	const notes = getNotes( responses.interactions.results, editId );
	const statuses = getStatuses( responses.statusHistory.status_history );

	//pinned.sort( sortByDateDescending );
	//other.sort( sortByDateDescending );
	//return pinned.concat( other );

	return notes.concat( statuses ).sort( sortByDateDescending );
};