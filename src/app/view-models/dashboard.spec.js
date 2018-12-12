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
			getSector,
			barrier: {
				status: {
					typeInfo: {
						1: { name: faker.lorem.words() },
						4: { name: faker.lorem.words() },
					}
				}
			}
		};

		viewModel = proxyquire( modulePath, {
			'../lib/metadata': metadata
		} );
	} );

	describe( 'When there are some barriers', () => {
		it( 'Should transform and sort them', () => {

			const barriers = jasmine.helpers.getFakeData( '/backend/barriers/index.dashboard' ).results;
			const output = viewModel( JSON.parse( JSON.stringify( barriers ) ) );

			function checkBarrier( id, index ){

				const barrier = barriers.find( ( barrier ) => barrier.id == id );
				const outputBarrier = output.barriers[ index ];

				expect( barrier ).toBeDefined();
				expect( outputBarrier ).toBeDefined();

				const country = metadata.countries.find( ( country ) => country.id == barrier.export_country );

				expect( outputBarrier ).toEqual( {
					id: barrier.id,
					code: barrier.code,
					title: barrier.barrier_title,
					country: {
						id: barrier.export_country,
						name: ( country && country.name )
					},
					status: metadata.barrier.status.typeInfo[ barrier.current_status.status ],
					supportNeeded: barrier.support_type === 1,
					hasContributors: barrier.contributor_count > 0,
					problemStatus: metadata.statusTypes[ barrier.problem_status ],
					sectors: ( barrier.sectors && barrier.sectors.map( () => getSector().name ) || [ 'Unknown' ] ),
					date: {
						reported: barrier.reported_on
					},
					priority: {
						...barrier.priority,
						modifyer: barrier.priority.code.toLowerCase()
					}
				} );
			}

			[ '1ec', '648', '7de', '553' ].forEach( checkBarrier );
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
