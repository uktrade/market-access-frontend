const metadata = require( '../../../lib/metadata' );
const modulePath = './interactions';

const getFakeData = jasmine.helpers.getFakeData;

const types = metadata.barrier.status.types;

describe( 'Interactions view model', () => {

	let viewModel;
	let OPEN;
	let RESOLVED;
	let PAUSED;

	beforeAll( async () => {

		jasmine.helpers.intercept.backend().get( '/metadata' ).reply( 200, getFakeData( '/backend/metadata/' ) );
		await metadata.fetch();

		OPEN = metadata.barrier.status.typeInfo[ types.OPEN ].name;
		RESOLVED = metadata.barrier.status.typeInfo[ types.RESOLVED ].name;
		PAUSED = metadata.barrier.status.typeInfo[ types.HIBERNATED ].name;
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

	function createStatus( item, from, to, isResolved, isOpen){
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
				isOpen
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
			createStatus( historyResults[ 1 ], 0, OPEN, false, true ),
			createStatus( historyResults[ 0 ], null, 0, false, false ),
		] );
	} );
} );
