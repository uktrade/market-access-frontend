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
	let mockType;
	let mockPriority;
	let barriers;
	let countryList;
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
			getCountry: jasmine.createSpy( 'metadata.getCountry' ),
			getCountryList: jasmine.createSpy( 'metadata.getCountryList' ),
			getSectorList: jasmine.createSpy( 'metadata.getSectorList' ),
			getBarrierType: jasmine.createSpy( 'metadata.getBarrierType' ),
			getBarrierTypeList: jasmine.createSpy( 'metadata.getBarrierTypeList' ),
			getBarrierPriority: jasmine.createSpy( 'metadata.getBarrierPriority' ),
			getBarrierPrioritiesList: jasmine.createSpy( 'metadata.getBarrierPrioritiesList' ),
		};

		mockSector = { id: uuid(), name: faker.lorem.words() };
		mockCountry = { id: uuid(), name: faker.address.country() };
		mockType = { id: uuid(), title: faker.lorem.words() };
		mockPriority = { code: faker.lorem.word().toUpperCase(), name: faker.lorem.words() };
		barriers = jasmine.helpers.getFakeData( '/backend/barriers/find-a-barrier' );

		countryList = [
			{ value: uuid(), text: faker.address.country() },
			{ value: uuid(), text: faker.address.country() },
			{ value: uuid(), text: faker.address.country() },
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

		metadata.getCountryList.and.callFake( () => countryList );
		metadata.getSectorList.and.callFake( () => sectorList );
		metadata.getSector.and.callFake( () => mockSector );
		metadata.getCountry.and.callFake( () => mockCountry );
		metadata.getBarrierType.and.callFake( () => mockType );
		metadata.getBarrierTypeList.and.callFake( () => barrierTypeList );
		metadata.getBarrierPriority.and.callFake( () => mockPriority );
		metadata.getBarrierPrioritiesList.and.callFake( () => barrierPriorityList );

		sortGovukItems = {
			alphabetical: jasmine.createSpy( 'sortGovukItems.alphabetical' ).and.callFake( () => 0 ),
		};

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
		expect( metadata.getSectorList ).toHaveBeenCalledWith( 'All sectors' );
		expect( metadata.getBarrierTypeList ).toHaveBeenCalledWith();
		expect( metadata.getBarrierPrioritiesList ).toHaveBeenCalledWith( { suffix: false } );
		expect( sortGovukItems.alphabetical ).toHaveBeenCalled();
		expect( urls.findABarrier.calls.count() ).toEqual( 4 );
		expect( urls.findABarrier ).toHaveBeenCalledWith( {} );
	} );

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
			expect( output.filters ).toEqual( {
				country: { items: countryList, active: undefined, removeUrl: findABarrierResponse },
				sector: { items: sectorList, active: undefined, removeUrl: findABarrierResponse },
				type: { items: barrierTypeList, active: undefined, removeUrl: findABarrierResponse },
				priority: { items: barrierPriorityList, active: undefined, removeUrl: findABarrierResponse },
			} );
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
			expect( output.filters ).toEqual( {
				country: { items: countryList, active: [ mockCountry ], removeUrl: findABarrierResponse },
				sector: { items: sectorList, active: undefined, removeUrl: findABarrierResponse },
				type: { items: barrierTypeList, active: undefined, removeUrl: findABarrierResponse },
				priority: { items: barrierPriorityList, active: undefined, removeUrl: findABarrierResponse },
			} );
			expect( countryList[ 2 ].selected ).toEqual( true );
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
			expect( output.filters ).toEqual( {
				country: { items: countryList, active: undefined, removeUrl: findABarrierResponse },
				sector: { items: sectorList, active: [ mockSector ], removeUrl: findABarrierResponse },
				type: { items: barrierTypeList, active: undefined, removeUrl: findABarrierResponse },
				priority: { items: barrierPriorityList, active: undefined, removeUrl: findABarrierResponse },
			} );
			expect( sectorList[ 2 ].selected ).toEqual( true );
			expect( output.hasFilters ).toEqual( true );
		} );
	} );

	describe( 'With a barrier type filter', () => {
		it( 'Should return the correct data', () => {

			const count = 5;
			const filters = { type: [ 3 ] };

			barrierTypeList[ 2 ].value = filters.type;

			const output = viewModel( {
				count,
				barriers,
				filters
			} );

			expect( output.count ).toEqual( count );
			expect( output.barriers ).toEqual( getExpectedBarrierOutput( barriers ) );
			expect( output.filters ).toEqual( {
				country: { items: countryList, active: undefined, removeUrl: findABarrierResponse },
				sector: { items: sectorList, active: undefined, removeUrl: findABarrierResponse },
				type: {
					items: barrierTypeList.map( ( item ) => {

						if( item.value == filters.type ){
							item.selected = true;
						}

						return item;
					} ),
					active: [ { name: mockType.title } ],
					removeUrl: findABarrierResponse
				},
				priority: { items: barrierPriorityList, active: undefined, removeUrl: findABarrierResponse },
			} );
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
			expect( output.filters ).toEqual( {
				country: { items: countryList, active: undefined, removeUrl: findABarrierResponse },
				sector: { items: sectorList, active: undefined, removeUrl: findABarrierResponse },
				type: { items: barrierTypeList, active: undefined, removeUrl: findABarrierResponse },
				priority: {
					items: barrierPriorityList.map( ( item ) => {

						if( item.value == filters.priority ){
							item.selected = true;
						}

						return item;
					} ),
					active: [ mockPriority ],
					removeUrl: findABarrierResponse,
				},
			} );
			expect( output.hasFilters ).toEqual( true );
		} );
	} );
} );
