const metadata = require( '../../../lib/metadata' );
const modulePath = './interactions';

const getFakeData = jasmine.helpers.getFakeData;

const { types, typeInfo } = metadata.barrier.status;

describe( 'Interactions view model', () => {

	let viewModel;
	let fakeMetadata;
	let OPEN;
	let RESOLVED;
	let PAUSED;
	let UNKNOWN;
	let PENDING;
	let PART_RESOLVED;

	beforeAll( async () => {

		fakeMetadata = getFakeData( '/backend/metadata/' );
		jasmine.helpers.intercept.backend().get( '/metadata' ).reply( 200, fakeMetadata );
		await metadata.fetch();

		OPEN = typeInfo[ types.OPEN ].name;
		PENDING = typeInfo[ types.PENDING ].name;
		RESOLVED = typeInfo[ types.RESOLVED ].name;
		PAUSED = typeInfo[ types.HIBERNATED ].name;
		UNKNOWN = typeInfo[ types.UNKNOWN ].name;
		PART_RESOLVED = typeInfo[ types.PART_RESOLVED ].name;
	} );

	beforeEach( async () => {

		viewModel = require( modulePath );
	} );

	function createNote( item, edit = false ){

		const hasDocuments = ( !!item.documents && !!item.documents.length );

		return {
			id: item.id,
			isNote: true,
			modifier: 'note',
			edit,
			date: item.created_on,
			text: item.text,
			user: item.created_by,
			hasDocuments,
			documents: []
		};
	}

	function createStatus( item, from, to, isResolved, showSummary ){
		return {
			isStatus: true,
			modifier: 'status',
			date: item.date,
			event: item.field_info.event,
			state: {
				from,
				to,
				date: item.field_info.status_date,
				isResolved,
				showSummary
			},
			text: item.field_info.status_summary,
			user: item.user,
		};
	}

	function createPriority( item ){

		return {
			isPriority: true,
			modifier: 'priority',
			date: item.date,
			priority: metadata.barrierPrioritiesMap[ item.new_value ],
			text: item.field_info.priority_summary,
			user: item.user
		};
	}

	it( 'Should combine the results and sort them', () => {

		const interactionsResults = getFakeData( '/backend/barriers/interactions-ordered' ).results;
		const historyResults = getFakeData( '/backend/barriers/history' ).history;

		const output = viewModel( {
			interactions: getFakeData( '/backend/barriers/interactions-ordered' ),
			history: getFakeData( '/backend/barriers/history' )
		}, String( interactionsResults[ 3 ].id ) );

		expect( output ).toEqual( [
			createNote( interactionsResults[ 3 ], true ),
			createNote( interactionsResults[ 4 ] ),
			createNote( interactionsResults[ 2 ] ),
			createStatus( historyResults[ 2 ], RESOLVED, OPEN, false, true ),
			createNote( interactionsResults[ 0 ] ),
			createStatus( historyResults[ 4 ], OPEN, PAUSED, false, false ),
			createPriority( historyResults[ 6 ] ),
			createStatus( historyResults[ 3 ], OPEN, RESOLVED, true, false ),
			createPriority( historyResults[ 5 ] ),
			createNote( interactionsResults[ 1 ] ),
			createStatus( historyResults[ 1 ], UNKNOWN, OPEN, false, true ),
			createStatus( historyResults[ 0 ], null, UNKNOWN, false, true ),
			createStatus( historyResults[ 7 ], OPEN, `${ PENDING } (${ fakeMetadata.barrier_pending.TWO })`, false, true ),
			createStatus( historyResults[ 8 ], OPEN, `${ PENDING } (${ historyResults[ 8 ].field_info.sub_status_other })`, false, true ),
			createStatus( historyResults[ 9 ], OPEN, PART_RESOLVED, true, false ),
		] );
	} );
} );
