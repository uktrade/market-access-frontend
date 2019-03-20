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

	function getExpectedBarrierOutput( barriers ){

		const expected = [];

		for( let barrier of barriers ){

			const sectors = ( barrier.sectors ? barrier.sectors.map( () => mockSector ) : [] );
			const barrierStatusCode = barrier.current_status.status;
			const status = metadata.barrier.status.typeInfo[ barrierStatusCode ] || {};

			expected.push({
				id: barrier.id,
				code: barrier.code,
				title: barrier.barrier_title,
				isOpen: ( barrierStatusCode === OPEN ),
				isResolved: ( barrierStatusCode === RESOLVED ),
				isHibernated: ( barrierStatusCode === HIBERNATED ),
				country: mockCountry,
				sectors,
				sectorsList: sectors.map( () => mockSector.name ),
				status,
				date: {
					reported: barrier.reported_on,
					status: barrier.current_status.status_date,
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

		viewModel = proxyquire( modulePath, {
			'../lib/metadata': metadata,
			'../lib/sort-govuk-items': sortGovukItems,
			'../lib/urls': urls,
		} );
	} );

	afterEach( () => {

		expect( metadata.getCountryList ).toHaveBeenCalledWith( 'All locations' );
		expect( metadata.getOverseasRegionList ).toHaveBeenCalledWith( 'All regions' );
		expect( metadata.getSectorList ).toHaveBeenCalledWith( 'All sectors' );
		expect( metadata.getBarrierTypeList ).toHaveBeenCalledWith();
		expect( metadata.getBarrierPrioritiesList ).toHaveBeenCalledWith( { suffix: false } );
		expect( sortGovukItems.alphabetical ).toHaveBeenCalled();
		expect( urls.findABarrier.calls.count() ).toEqual( 5 );
		expect( urls.findABarrier ).toHaveBeenCalledWith( {} );
	} );

	function getFilters( overrides = {} ){

		return {
			country: overrides.country || { items: countryList, active: undefined, removeUrl: findABarrierResponse },
			region: overrides.region || { items: overseasRegionList, active: undefined, removeUrl: findABarrierResponse },
			sector: overrides.sector || { items: sectorList, active: undefined, removeUrl: findABarrierResponse },
			type: overrides.type || { items: barrierTypeList, active: undefined, removeUrl: findABarrierResponse },
			priority: overrides.priority || { items: barrierPriorityList, active: undefined, removeUrl: findABarrierResponse },
		};
	}

	describe( 'Without any filters', () => {
		it( 'Should return the correct data', () => {

			const count = 20;
			const filters = {};

			const output = viewModel( {
				count,
				barriers,
				filters
			} );

			expect( output.count ).toEqual( count );
			expect( output.barriers ).toEqual( getExpectedBarrierOutput( barriers ) );
			expect( output.filters ).toEqual( getFilters() );
			expect( output.hasFilters ).toEqual( false );
		} );
	} );

	describe( 'With a country filter', () => {
		it( 'Should return the correct data', () => {

			const count = 10;
			const filters = { country: [ uuid() ] };

			countryList[ 2 ].value = filters.country[ 0 ];

			const output = viewModel( {
				count,
				barriers,
				filters
			} );

			expect( output.count ).toEqual( count );
			expect( output.barriers ).toEqual( getExpectedBarrierOutput( barriers ) );
			expect( output.filters ).toEqual( getFilters( {
				country: { items: countryList, active: [ mockCountry ], removeUrl: findABarrierResponse },
			} ) );
			expect( countryList[ 2 ].checked ).toEqual( true );
			expect( output.hasFilters ).toEqual( true );
		} );
	} );

	describe( 'With a overseas region filter', () => {
		it( 'Should return the correct data', () => {

			const count = 10;
			const filters = { region: [ uuid() ] };

			overseasRegionList[ 2 ].value = filters.region[ 0 ];

			const output = viewModel( {
				count,
				barriers,
				filters
			} );

			expect( output.count ).toEqual( count );
			expect( output.barriers ).toEqual( getExpectedBarrierOutput( barriers ) );
			expect( output.filters ).toEqual( getFilters({
				region: { items: overseasRegionList, active: [ mockRegion ], removeUrl: findABarrierResponse },
			}) );
			expect( overseasRegionList[ 2 ].checked ).toEqual( true );
			expect( output.hasFilters ).toEqual( true );
		} );
	} );

	describe( 'With a sector filter', () => {
		it( 'Should return the correct data', () => {

			const count = 5;
			const filters = { sector: [ uuid() ] };

			sectorList[ 2 ].value = filters.sector[ 0 ];

			const output = viewModel( {
				count,
				barriers,
				filters
			} );

			expect( output.count ).toEqual( count );
			expect( output.barriers ).toEqual( getExpectedBarrierOutput( barriers ) );
			expect( output.filters ).toEqual( getFilters({
				sector: { items: sectorList, active: [ mockSector ], removeUrl: findABarrierResponse },
			}) );
			expect( sectorList[ 2 ].checked ).toEqual( true );
			expect( output.hasFilters ).toEqual( true );
		} );
	} );

	describe( 'With a barrier type filter', () => {
		it( 'Should return the correct data', () => {

			const count = 5;
			const selectedType = 999;
			const filters = { type: [ String( selectedType ) ] };

			barrierTypeList[ 1 ].value = selectedType;

			const output = viewModel( {
				count,
				barriers,
				filters
			} );

			expect( output.count ).toEqual( count );
			expect( output.barriers ).toEqual( getExpectedBarrierOutput( barriers ) );
			expect( output.filters ).toEqual( getFilters({
				type: {
					items: barrierTypeList.map( ( { text, value } ) => {

						const item = { text, value };

						if( value == selectedType ){
							item.checked = true;
						}

						return item;

					} ).sort( ( a, b ) => a.text.localeCompare( b.text ) ),
					active: [ { name: mockType.title } ],
					removeUrl: findABarrierResponse
				},
			}) );
			expect( output.hasFilters ).toEqual( true );
		} );
	} );

	describe( 'With a barrier priority filter', () => {
		it( 'Should return the correct data', () => {

			const count = 5;
			const filters = { priority: [ faker.lorem.word().toUpperCase() ] };

			barrierPriorityList[ 2 ].value = filters.priority[ 0 ];

			const output = viewModel( {
				count,
				barriers,
				filters
			} );

			expect( output.count ).toEqual( count );
			expect( output.barriers ).toEqual( getExpectedBarrierOutput( barriers ) );
			expect( output.filters ).toEqual( getFilters({
				priority: {
					items: barrierPriorityList.map( ( { text, value } ) => {

						const item = { text, value };

						if( value == filters.priority ){
							item.checked = true;
						}

						return item;
					} ),
					active: [ mockPriority ],
					removeUrl: findABarrierResponse,
				},
			}) );
			expect( output.hasFilters ).toEqual( true );
		} );
	} );
} );
