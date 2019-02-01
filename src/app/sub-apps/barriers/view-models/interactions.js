const metadata = require( '../../../lib/metadata' );
const fileSize = require( '../../../lib/file-size' );

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

function getDocument( doc ){

	const canDownload = doc.status === 'virus_scanned';

	return {
		id: doc.id,
		name: doc.name,
		size: fileSize( doc.size ),
		canDownload,
		status: metadata.documentStatus[ doc.status ]
	};
}

function getNotes( items, editId ){

	const notes = [];

	for( let item of items ){

		const hasDocuments = ( !!item.documents && !!item.documents.length );

		notes.push( {
			id: item.id,
			isNote: true,
			modifier: 'note',
			edit: ( item.id == editId ),
			date: item.created_on,
			text: item.text,
			user: item.created_by,
			hasDocuments,
			documents: ( hasDocuments ? item.documents.map( getDocument ) : [] )
		} );
	}

	return notes;
}

function getStatus( item ){

	return {
		isStatus: true,
		modifier: 'status',
		date: item.date,
		event: item.field_info.event,
		state: {
			from: getStatusType( item.old_value ),
			to: getStatusType( item.new_value ),
			date: item.field_info.status_date,
			isResolved: ( item.new_value === metadata.barrier.status.types.RESOLVED )
		},
		text: item.field_info.status_summary,
		user: item.user,
	};
}

function getPriority( item ){

	const priorityCode = ( item.new_value === 'None' ? 'UNKNOWN' : item.new_value );

	return {
		isPriority: true,
		modifier: 'priority',
		date: item.date,
		priority: metadata.barrierPrioritiesMap[ priorityCode ],
		text: item.field_info.priority_summary,
		user: item.user,
	};
}

function getHistory( items ){

	const history = [];

	for( let item of items ){

		switch( item.field ){

			case 'status':
				history.push( getStatus( item ) );
			break;

			case 'priority':
				history.push( getPriority( item ) );
			break;
		}
	}

	return history;
}

module.exports = function ( responses, editId ){

	const notes = getNotes( responses.interactions.results, editId );
	const history = getHistory( responses.history.history );

	return notes.concat( history ).sort( sortByDateDescending );
};
