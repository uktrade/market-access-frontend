const proxyquire = require( 'proxyquire' );
const faker = require( 'faker' );
const modulePath = './dashboard';

describe( 'Dashboard view model', () => {

	let viewModel;
	let metadata;
	let queryString;
	let editQueryString;
	let locals;
	let watchListIndex;
	let page;
	let pagination;
	let createPaginationResponse;

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

		queryString = { param1: '1', param2: '2' };
		locals = { a: 'b', c: 'd' };
		watchListIndex = 1;
		editQueryString = { ...queryString, editList: watchListIndex };
		page = Math.round( Math.random() * 4 ) + 1;
		createPaginationResponse = { some: 'pagination data' };

		pagination = {
			create: jasmine.createSpy( 'pagination.create' ).and.returnValue( createPaginationResponse ),
		};

		viewModel = proxyquire( modulePath, {
			'../lib/metadata': metadata,
			'../lib/pagination': pagination,
		} );
	} );

	describe( 'When there are some barriers', () => {
		it( 'Should transform and not sort them', () => {

			const barriers = jasmine.helpers.getFakeData( '/backend/barriers/index.dashboard' );

			const output = viewModel( JSON.parse( JSON.stringify( barriers ) ), page, { fields: [] }, queryString, watchListIndex, locals );

			function checkBarrier( id, index ){

				const barrier = barriers.results.find( ( barrier ) => barrier.id == id );
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
					status: metadata.barrier.status.typeInfo[ barrier.status.id ],
					supportNeeded: barrier.support_type === 1,
					hasContributors: barrier.contributor_count > 0,
					problemStatus: metadata.statusTypes[ barrier.problem_status ],
					sectors: ( barrier.all_sectors ? [ 'All sectors'] : barrier.sectors && barrier.sectors.map( () => getSector().name ) || [ 'Unknown' ] ),
					date: {
						reported: barrier.reported_on,
						created: barrier.created_on,
						modified: barrier.modified_on
					},
					priority: {
						...barrier.priority,
						modifier: barrier.priority.code.toLowerCase()
					}
				} );
			}

			expect( output.barrierCount ).toEqual( barriers.count );
			expect( output.editQueryString ).toEqual( editQueryString );
			expect( output.watchListIndex ) .toEqual( 1 );
			expect( output.paginationData ).toEqual( createPaginationResponse );

			[ '7de', '1ec', '648', '553' ].forEach( checkBarrier );
		} );
	} );

	describe( 'When the list of barriers is empty', () => {
		it( 'Should return the barriers and other data', () => {

			const input = { results: [], count: 100 };
			const sortData = {
				fields: [],
				currentSort: {},
			};

			const output = viewModel( input, page, sortData, queryString, watchListIndex, {}, locals );

			expect( output ).toEqual({
				...locals,
				barriers: input.results,
				paginationData: createPaginationResponse,
				sortableFields: {},
				barrierCount: 100,
				editQueryString,
				watchListIndex,
			});
		} );
	} );
} );
