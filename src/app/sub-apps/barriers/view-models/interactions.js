const metadata = require( '../../../lib/metadata' );
const fileSize = require( '../../../lib/file-size' );

const { OPEN, RESOLVED, PART_RESOLVED, PENDING, UNKNOWN } = metadata.barrier.status.types;
const typeInfo = metadata.barrier.status.typeInfo;
const { OTHER } = metadata.barrier.status.pending;

function getSubStatusText( fieldInfo ){

	const isOther = ( fieldInfo.sub_status === OTHER );
	const subStatus = metadata.barrierPendingOptions[ fieldInfo.sub_status ];

	return ` (${ isOther ? fieldInfo.sub_status_other : subStatus })`;
}

function getStatusType( id, fieldInfo ){

	if( id !== null && typeInfo.hasOwnProperty( id ) ){

		const name = typeInfo[ id ].name;
		const subStatus = ( fieldInfo && id == PENDING ? getSubStatusText( fieldInfo ) : '' );

		return ( name + subStatus );
	}

	return  id;
}

function sortByDateDescending( a, b ){

	const aDate = Date.parse( a.date );
	const bDate = Date.parse( b.date );

	return ( aDate === bDate ? 0 : ( aDate > bDate ? -1 : 1 ) );
}

function getDocument( doc ){

	return {
		id: doc.id,
		name: doc.name,
		size: fileSize( doc.size ),
		canDownload: ( doc.status === 'virus_scanned' ),
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

	const statusId = item.new_value;

	return {
		isStatus: true,
		modifier: 'status',
		date: item.date,
		event: item.field_info.event,
		state: {
			from: getStatusType( item.old_value ),
			to: getStatusType( statusId, item.field_info ),
			date: item.field_info.status_date,
			isResolved: ( statusId == RESOLVED || statusId == PART_RESOLVED ),
			showSummary: ( statusId == OPEN || statusId == UNKNOWN || statusId == PENDING )
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
