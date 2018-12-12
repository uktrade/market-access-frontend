const modulePath = './interactions';

const getFakeData = jasmine.helpers.getFakeData;

const OPEN = 'Open';
const RESOLVED = 'Resolved';
const PAUSED = 'Paused';

describe( 'Interactions view model', () => {

	let viewModel;

	beforeEach( () => {

		viewModel = require( modulePath );
	} );

	function createNote( item, edit = false ){

		const hasDocuments = ( !!item.documents && !!item.documents.length );

		return {
			id: item.id,
			isNote: true,
			edit,
			date: item.created_on,
			text: item.text,
			user: item.created_by,
			hasDocuments,
			documents: []
		};
	}

	function createStatus( item, from, to, isResolved ){
		return {
			isStatus: true,
			date: item.date,
			event: item.event,
			state: {
				from,
				to,
				date: item.status_date,
				isResolved
			},
			text: item.status_summary,
			user: item.user,
		};
	}

	it( 'Should combine the results and sort them', () => {

		const interactionsResults = getFakeData( '/backend/barriers/interactions-ordered' ).results;
		const statusHistoryResults = getFakeData( '/backend/barriers/status_history' ).status_history;

		const output = viewModel( {
			interactions: getFakeData( '/backend/barriers/interactions-ordered' ),
			statusHistory: getFakeData( '/backend/barriers/status_history' )
		}, String( interactionsResults[ 3 ].id ) );

		expect( output ).toEqual( [
			createNote( interactionsResults[ 3 ], true ),
			createNote( interactionsResults[ 4 ] ),
			createNote( interactionsResults[ 2 ] ),
			createStatus( statusHistoryResults[ 2 ], RESOLVED, OPEN, false ),
			createNote( interactionsResults[ 0 ] ),
			createStatus( statusHistoryResults[ 4 ], OPEN, PAUSED, false ),
			createStatus( statusHistoryResults[ 3 ], OPEN, RESOLVED, true ),
			createNote( interactionsResults[ 1 ] ),
			createStatus( statusHistoryResults[ 1 ], 0, OPEN, false ),
			createStatus( statusHistoryResults[ 0 ], null, 0, false ),
		] );
	} );
} );
