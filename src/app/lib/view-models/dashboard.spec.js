const proxyquire = require( 'proxyquire' );
const modulePath = './dashboard';

describe( 'Dashboard view model', () => {

	let viewModel;
	let metadata;

	beforeEach( () => {

		metadata = {
			countries: [
				{ id: 'abc-1', name: 'country 1' },
				{ id: 'abc-2', name: 'country 2' },
				{ id: 'abc-3', name: 'country 3' }
			]
		};

		viewModel = proxyquire( modulePath, {
			'../metadata': metadata
		} );
	} );

	describe( 'When there are some barriers', () => {
		it( 'Should transform and sort them', () => {

			const barriers = [
				{ id: 1, export_country: 'abc-1', current_status: 1, support_type: 2, contributor_count: 4, reported_on: 'Wed Nov 22 2017 10:45:25 GMT+0000 (GMT)' },
				{ id: 2, export_country: 'abc-3', current_status: 2, support_type: 1, contributor_count: 0, reported_on: 'Fri Jun 01 2018 01:43:07 GMT+0100 (BST)' },
				{ id: 3, export_country: 'def-1', current_status: 1, support_type: 2, contributor_count: 4, reported_on: 'Sat Mar 10 2018 12:51:35 GMT+0000 (GMT)' }
			];

			const output = viewModel( barriers );

			function checkBarrier( index, properties ){

				const barrier = output.barriers[ index ];

				for( let [ key, value ] of Object.entries( properties ) ){

					expect( barrier[ key ] ).toEqual( value );
				}
			}

			checkBarrier( 0, {
				id: 1,
				country: {
					id: barriers[ 0 ].export_country,
					name: metadata.countries[ 0 ].name
				},
				resolved: false,
				supportNeeded: false,
				hasContributors: true
			} );

			checkBarrier( 1, {
				id: 3,
				country: {
					id: barriers[ 2 ].export_country,
					name: undefined
				},
				resolved: false,
				supportNeeded: false,
				hasContributors: true
			} );

			checkBarrier( 2, {
				id: 2,
				country: {
					id: barriers[ 1 ].export_country,
					name: metadata.countries[ 2 ].name
				},
				resolved: true,
				supportNeeded: true,
				hasContributors: false
			} );
		} );
	} );

	describe( 'When the list of barriers is empty', () => {
		it( 'Should return the barriers', () => {

			const input = [];
			const output = viewModel( input );

			expect( output ).toEqual( { barriers: input } );
		} );
	} );
} );
