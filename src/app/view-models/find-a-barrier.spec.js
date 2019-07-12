const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid' );
const faker = require( 'faker' );
const modulePath = './find-a-barrier';

const OPEN = 2;
const RESOLVED = 4;
const HIBERNATED = 5;

describe( 'Find a barrier view model', () => {

	let metadata;
	let viewModel;
	let mockSector;
	let mockCountry;
	let mockRegion;
	let mockType;
	let mockPriority;
	let barriers;
	let countryList;
	let overseasRegionList;
	let sectorList;
	let barrierTypeList;
	let sortGovukItems;
	let barrierPriorityList;
	let urls;
	let findABarrierResponse;
	let strings;

	function getExpectedBarrierOutput( barriers ){

		const expected = [];

		for( let barrier of barriers ){

			const sectors = ( barrier.sectors ? barrier.sectors.map( () => mockSector ) : [] );
			const barrierStatusCode = barrier.status;
			const status = metadata.barrier.status.typeInfo[ barrierStatusCode ] || {};

			expected.push({
				id: barrier.id,
				code: barrier.code,
				title: barrier.barrier_title,
				isOpen: ( barrierStatusCode === OPEN ),
				isResolved: ( barrierStatusCode === RESOLVED ),
				isHibernated: ( barrierStatusCode === HIBERNATED ),
				location: strings.location.response,
				sectors,
				sectorsList: sectors.map( () => mockSector.name ),
				status,
				date: {
					reported: barrier.reported_on,
					status: barrier.status_date,
					created: barrier.created_on,
				},
				priority: barrier.priority
			});
		}

		return expected;
	}

	beforeEach( () => {

		metadata = {
			barrier: {
				status: {
					types: {
						OPEN,
						RESOLVED,
						HIBERNATED
					},
					typeInfo: {
						2: {},
						4: {},
						5: {}
					}
				}
			},
			adminAreasByCountry: {},
			getSector: jasmine.createSpy( 'metadata.getSector' ),
			getSectorList: jasmine.createSpy( 'metadata.getSectorList' ),
			getCountry: jasmine.createSpy( 'metadata.getCountry' ),
			getCountryList: jasmine.createSpy( 'metadata.getCountryList' ),
			getOverseasRegion: jasmine.createSpy( 'metadata.getOverseasRegion' ),
			getOverseasRegionList: jasmine.createSpy( 'metadata.getOverseasRegionList' ),
			getBarrierType: jasmine.createSpy( 'metadata.getBarrierType' ),
			getBarrierTypeList: jasmine.createSpy( 'metadata.getBarrierTypeList' ),
			getBarrierPriority: jasmine.createSpy( 'metadata.getBarrierPriority' ),
			getBarrierPrioritiesList: jasmine.createSpy( 'metadata.getBarrierPrioritiesList' ),
		};

		mockSector = { id: uuid(), name: faker.lorem.words() };
		mockCountry = { id: uuid(), name: faker.address.country() };
		mockRegion = { id: uuid(), name: faker.lorem.words() };
		mockType = { id: uuid(), title: faker.lorem.words() };
		mockPriority = { code: faker.lorem.word().toUpperCase(), name: faker.lorem.words() };
		barriers = jasmine.helpers.getFakeData( '/backend/barriers/find-a-barrier' );

		countryList = [
			{ value: uuid(), text: faker.address.country() },
			{ value: uuid(), text: faker.address.country() },
			{ value: uuid(), text: faker.address.country() },
		];

		overseasRegionList = [
			{ value: uuid(), text: faker.lorem.words() },
			{ value: uuid(), text: faker.lorem.words() },
			{ value: uuid(), text: faker.lorem.words() },
		];

		sectorList = [
			{ value: uuid(), text: faker.lorem.words() },
			{ value: uuid(), text: faker.lorem.words() },
			{ value: uuid(), text: faker.lorem.words() },
		];

		barrierTypeList = [
			{ value: 1, text: faker.lorem.words() },
			{ value: 2, text: faker.lorem.words() },
			{ value: 3, text: faker.lorem.words() },
		];

		barrierPriorityList = [
			{ value: faker.lorem.word().toUpperCase(), text: faker.lorem.words() },
			{ value: faker.lorem.word().toUpperCase(), text: faker.lorem.words() },
			{ value: faker.lorem.word().toUpperCase(), text: faker.lorem.words() },
			{ value: faker.lorem.word().toUpperCase(), text: faker.lorem.words() },
		];

		sortGovukItems = {
			alphabetical: jasmine.createSpy( 'sortGovukItems.alphabetical' ).and.callFake( ( a, b ) => a.text > b.text ),
		};

		metadata.getCountryList.and.callFake( () => countryList );
		metadata.getOverseasRegionList.and.callFake( () => overseasRegionList );
		metadata.getSectorList.and.callFake( () => sectorList );
		metadata.getSector.and.callFake( () => mockSector );
		metadata.getCountry.and.callFake( () => mockCountry );
		metadata.getOverseasRegion.and.callFake( () => mockRegion );
		metadata.getBarrierType.and.callFake( () => mockType );
		metadata.getBarrierTypeList.and.callFake( () => barrierTypeList );
		metadata.getBarrierPriority.and.callFake( () => mockPriority );
		metadata.getBarrierPrioritiesList.and.callFake( () => barrierPriorityList );

		findABarrierResponse = '/a/b/c';

		urls = {
			findABarrier: jasmine.createSpy( 'urls.findABarrier' ).and.callFake( () => findABarrierResponse ),
		};

		strings = jasmine.helpers.mocks.strings();

		viewModel = proxyquire( modulePath, {
			'../lib/metadata': metadata,
			'../lib/sort-govuk-items': sortGovukItems,
			'../lib/urls': urls,
			'../lib/strings': strings,
		} );
	} );

	afterEach( () => {

		expect( metadata.getCountryList ).toHaveBeenCalledWith( 'All locations' );
		expect( metadata.getOverseasRegionList ).toHaveBeenCalledWith( 'All regions' );
		expect( metadata.getSectorList ).toHaveBeenCalledWith( 'All sectors' );
		expect( metadata.getBarrierTypeList ).toHaveBeenCalledWith();
		expect( metadata.getBarrierPrioritiesList ).toHaveBeenCalledWith( { suffix: false } );
		expect( sortGovukItems.alphabetical ).toHaveBeenCalled();
		expect( urls.findABarrier.calls.count() ).toEqual( 6 );
	} );

	function getFilters( overrides = {} ){

		return {
			country: overrides.country || { items: countryList, active: false, text: strings.locations.response, removeUrl: findABarrierResponse },
			region: overrides.region || { items: overseasRegionList, active: false, text: strings.regions.response, removeUrl: findABarrierResponse },
			sector: overrides.sector || { items: sectorList, active: false, text: strings.sectors.response, removeUrl: findABarrierResponse },
			type: overrides.type || { items: barrierTypeList, active: false, text: strings.types.response, removeUrl: findABarrierResponse },
			priority: overrides.priority || { items: barrierPriorityList, active: false, text: strings.priorities.response, removeUrl: findABarrierResponse },
			search: overrides.search || { active: false, text: undefined, removeUrl: findABarrierResponse },
		};
	}

	describe( 'Without any filters', () => {

		let queryString;
		let count;
		let filters;

		beforeEach( () => {

			count = 20;
			filters = {};
			queryString = {};
		} );

		describe( 'When isEdit is true', () => {

			let isEdit;
			let editListIndex;

			beforeEach( () => {

				isEdit = true;
				editListIndex = String( faker.random.number( 10 ) );
			} );

			afterEach( () => {

				expect( urls.findABarrier ).toHaveBeenCalledWith( { editList: editListIndex } );
			} );

			describe( 'When filtersMatchEditList is true', () => {
				it( 'Should set showSaveButton to false', () => {

					const filtersMatchEditList = true;
					const output = viewModel( {
						count,
						barriers,
						filters,
						queryString,
						isEdit,
						editListIndex,
						filtersMatchEditList
					} );

					expect( output.showSaveButton ).toEqual( false );
				} );
			} );

			describe( 'When filtersMatchEditList is false', () => {
				it( 'Should set showSaveButton to true', () => {

					const filtersMatchEditList = false;
					const output = viewModel( {
						count,
						barriers,
						filters,
						queryString,
						isEdit,
						editListIndex,
						filtersMatchEditList
					} );

					expect( output.showSaveButton ).toEqual( true );
				} );
			} );
		} );

		it( 'Should return the correct data', () => {

			const isEdit = false;
			const filtersMatchEditList = false;

			const output = viewModel( {
				count,
				barriers,
				filters,
				queryString,
				isEdit,
				filtersMatchEditList,
			} );

			expect( output.count ).toEqual( count );
			expect( output.barriers ).toEqual( getExpectedBarrierOutput( barriers ) );
			expect( output.filters ).toEqual( getFilters() );
			expect( output.hasFilters ).toEqual( false );
			expect( output.queryString ).toEqual( queryString );
			expect( output.isEdit ).toEqual( isEdit );
			expect( output.editListIndex ).not.toBeDefined();
			expect( output.showSaveButton ).toEqual( false );
			expect( urls.findABarrier ).toHaveBeenCalledWith( {} );
		} );
	} );

	describe( 'With filters', () => {

		let count;
		let filters;
		let queryString;
		let editListIndex;

		beforeEach( () => {

			count = faker.random.number( 100 );
			filters = {};
			queryString = { param1: 'one', param2: 'two' };
			editListIndex = String( faker.random.number( 10 ) );
		} );

		function checkFilter( setup, assert ){

			function checkCommonOutput( output ){

				expect( output.count ).toEqual( count );
				expect( output.barriers ).toEqual( getExpectedBarrierOutput( barriers ) );
				expect( output.hasFilters ).toEqual( true );
				expect( output.queryString ).toEqual( queryString );
				expect( output.editListIndex ).toEqual( editListIndex );
				expect( output.filterParams ).toEqual( filters );
			}

			describe( 'When isEdit is false', () => {
				it( 'Returns the correct data', () => {

					setup();

					const output = viewModel( {
						count,
						barriers,
						filters,
						queryString,
						editListIndex,
						isEdit: false,
						filtersMatchEditList: false,
					} );

					checkCommonOutput( output );
					expect( output.isEdit ).toEqual( false );
					expect( output.showSaveButton ).toEqual( true );
					expect( urls.findABarrier ).toHaveBeenCalledWith( filters );
					assert( output );
				} );
			} );

			describe( 'When isEdit is true', () => {

				afterEach( () => {

					expect( urls.findABarrier ).toHaveBeenCalledWith( { ...filters, editList: editListIndex } );
				} );

				describe( 'When filtersMatchEditList is true', () => {
					it( 'Returns the correct data and sets showSaveButton to false', () => {

						setup();

						const output = viewModel( {
							count,
							barriers,
							filters,
							queryString,
							editListIndex,
							isEdit: true,
							filtersMatchEditList: true
						} );

						checkCommonOutput( output );
						expect( output.isEdit ).toEqual( true );
						expect( output.editListIndex ).toEqual( editListIndex );
						expect( output.showSaveButton ).toEqual( false );
						assert( output );
					} );
				} );

				describe( 'When filtersMatchEditList is false', () => {
					it( 'Returns the correct data and sets showSaveButton to true', () => {

						setup();

						const output = viewModel( {
							count,
							barriers,
							filters,
							queryString,
							editListIndex,
							isEdit: true,
							filtersMatchEditList: false
						} );

						checkCommonOutput( output );
						expect( output.isEdit ).toEqual( true );
						expect( output.editListIndex ).toEqual( editListIndex );
						expect( output.showSaveButton ).toEqual( true );
						assert( output );
					} );
				} );
			} );
		}

		describe( 'Country filter', () => {

			checkFilter( () => {

				filters.country = [ uuid() ];
				countryList[ 2 ].value = filters.country[ 0 ];

			}, ( output ) => {

				expect( output.filters ).toEqual( getFilters( {
					country: { items: countryList, active: true, text: strings.locations.response, removeUrl: findABarrierResponse },
				} ) );
				expect( countryList.find( ( country ) => country.value === filters.country[ 0 ] ).checked ).toEqual( true );
				expect( strings.locations ).toHaveBeenCalledWith( filters.country );
			} );
		} );

		describe( 'Overseas region filter', () => {

			checkFilter( () => {

				filters.region = [ uuid() ];
				overseasRegionList[ 2 ].value = filters.region[ 0 ];

			}, ( output ) => {

				expect( output.filters ).toEqual( getFilters( {
					region: { items: overseasRegionList, active: true, text: strings.regions.response, removeUrl: findABarrierResponse }
				} ) );
				expect( overseasRegionList[ 2 ].checked ).toEqual( true );
				expect( strings.regions ).toHaveBeenCalledWith( filters.region );
			} );
		} );

		describe( 'Sector filter', () => {

			checkFilter( () => {

				filters.sector = [ uuid() ];
				sectorList[ 2 ].value = filters.sector[ 0 ];

			}, ( output ) => {

				expect( output.filters ).toEqual( getFilters( {
					sector: { items: sectorList, active: true, text: strings.sectors.response, removeUrl: findABarrierResponse }
				} ) );
				expect( sectorList[ 2 ].checked ).toEqual( true );
				expect( strings.sectors ).toHaveBeenCalledWith( filters.sector );
			} );
		} );

		describe( 'Barrier type filter', () => {

			const selectedType = 999;

			checkFilter( () => {

				filters.type = [ String( selectedType ) ];
				barrierTypeList[ 1 ].value = selectedType;

			}, ( output ) => {

				expect( output.filters ).toEqual( getFilters({
					type: {
						items: barrierTypeList.map( ( { text, value } ) => {

							const item = { text, value };

							if( value == selectedType ){
								item.checked = true;
							}

							return item;

						} ).sort( ( a, b ) => a.text.localeCompare( b.text ) ),
						active: true,
						text: strings.types.response,
						removeUrl: findABarrierResponse
					},
				}) );
				expect( strings.types ).toHaveBeenCalledWith( filters.type );
			} );
		} );

		describe( 'Barrier priority filter', () => {

			checkFilter( () => {

				filters.priority = [ faker.lorem.word().toUpperCase() ];
				barrierPriorityList[ 2 ].value = filters.priority[ 0 ];

			}, ( output ) => {

				expect( output.filters ).toEqual( getFilters({
					priority: {
						items: barrierPriorityList.map( ( { text, value } ) => {

							const item = { text, value };

							if( value == filters.priority ){
								item.checked = true;
							}

							return item;
						} ),
						active: true,
						text: strings.priorities.response,
						removeUrl: findABarrierResponse,
					},
				}) );
				expect( strings.priorities ).toHaveBeenCalledWith( filters.priority );
			} );
		} );

		describe( 'Search filter', () => {

			checkFilter( () => {

				filters.search = faker.lorem.words( 3 );

			}, ( output ) => {

				expect( output.filters ).toEqual( getFilters( {
					search: { active: true, text: filters.search, removeUrl: findABarrierResponse }
				} ) );
			} );
		} );
	} );
} );
