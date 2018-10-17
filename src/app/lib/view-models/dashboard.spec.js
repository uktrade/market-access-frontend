const proxyquire = require( 'proxyquire' );
const faker = require( 'faker' );
const modulePath = './dashboard';

describe( 'Dashboard view model', () => {

	let viewModel;
	let metadata;

	function getSector(){
		return { name: 'a sector' };
	}

	beforeEach( () => {

		metadata = {
			countries: [
				{ id: 'abc-1', name: 'country 1' },
				{ id: 'abc-2', name: 'country 2' },
				{ id: 'abc-3', name: 'country 3' }
			],
			statusTypes: {
				'1': 'type a',
				'2': 'type b'
			},
			getSector
		};

		viewModel = proxyquire( modulePath, {
			'../metadata': metadata
		} );
	} );

	describe( 'When there are some barriers', () => {
		it( 'Should transform and sort them', () => {

			const barriers = [
				{ id: 1, barrier_title: faker.lorem.words(), problem_status: 1, export_country: 'abc-1', sectors: [ 'a', 'b' ], current_status: { status: 1 }, support_type: 2, contributor_count: 4, reported_on: 'Wed Nov 22 2017 10:45:25 GMT+0000 (GMT)' },
				{ id: 2, barrier_title: faker.lorem.words(), problem_status: 2, export_country: 'abc-3', current_status: { status: 4 }, support_type: 1, contributor_count: 0, reported_on: 'Fri Jun 01 2018 01:43:07 GMT+0100 (BST)' },
				{ id: 3, barrier_title: faker.lorem.words(), problem_status: 1, export_country: 'def-1', sectors: [ 'c', 'd' ], current_status: { status: 1 }, support_type: 2, contributor_count: 4, reported_on: 'Sat Mar 10 2018 12:51:35 GMT+0000 (GMT)' },
				{ id: 4, barrier_title: faker.lorem.words(), problem_status: 2, export_country: 'def-2', current_status: { status: 1 }, support_type: 2, contributor_count: 4, reported_on: 'Wed Nov 22 2017 10:45:25 GMT+0000 (GMT)' }
			];

			const output = viewModel( JSON.parse( JSON.stringify( barriers ) ) );

			function checkBarrier( id, index ){

				const barrier = barriers.find( ( barrier ) => barrier.id == id );
				const outputBarrier = output.barriers[ index ];

				expect( barrier ).toBeDefined();
				expect( outputBarrier ).toBeDefined();

				const country = metadata.countries.find( ( country ) => country.id == barrier.export_country );

				expect( outputBarrier ).toEqual( {
					id: barrier.id,
					title: barrier.barrier_title,
					country: {
						id: barrier.export_country,
						name: ( country && country.name )
					},
					resolved: ( ( barrier.current_status && barrier.current_status.status ) === 4 ),
					supportNeeded: barrier.support_type === 1,
					hasContributors: barrier.contributor_count > 0,
					problemStatus: metadata.statusTypes[ barrier.problem_status ],
					sectors: ( barrier.sectors && barrier.sectors.map( () => getSector().name ) || [ 'Unknown' ] ),
					date: {
						reported: barrier.reported_on
					}
				} );
			}

			[ 2, 3, 1, 4 ].forEach( checkBarrier );
		} );
	} );

	describe( 'When the list of barriers is empty and the country is undefined', () => {
		it( 'Should return the barriers and country', () => {

			const input = [];
			let country;
			const output = viewModel( input, country );

			expect( output ).toEqual( { barriers: input, country } );
		} );
	} );
} );
