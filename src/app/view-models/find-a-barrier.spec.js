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
	let barriers;
	let countryList;
	let sectorList;
	let barrierTypeList;
	let sortGovukItems;

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
				}
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
			getBarrierTypeList: jasmine.createSpy( 'jasmine.getBarrierTypeList' ),
		};

		mockSector = { id: uuid(), name: faker.lorem.words() };
		mockCountry = { id: uuid(), name: faker.address.country() };
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

		metadata.getCountryList.and.callFake( () => countryList );
		metadata.getSectorList.and.callFake( () => sectorList );
		metadata.getSector.and.callFake( () => mockSector );
		metadata.getCountry.and.callFake( () => mockCountry );
		metadata.getBarrierTypeList.and.callFake( () => barrierTypeList );

		sortGovukItems = {
			alphabetical: jasmine.createSpy( 'sortGovukItems.alphabetical' ).and.callFake( () => 0 ),
		};

		viewModel = proxyquire( modulePath, {
			'../lib/metadata': metadata,
			'../lib/sort-govuk-items': sortGovukItems,
		} );
	} );

	afterEach( () => {

		expect( metadata.getCountryList ).toHaveBeenCalledWith( 'All locations' );
		expect( metadata.getSectorList ).toHaveBeenCalledWith( 'All sectors' );
		expect( metadata.getBarrierTypeList ).toHaveBeenCalledWith();
		expect( sortGovukItems.alphabetical ).toHaveBeenCalled();
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
				country: countryList,
				sector: sectorList,
				type: barrierTypeList
			} );
			expect( output.hasFilters ).toEqual( false );
		} );
	} );

	describe( 'With a country filter', () => {
		it( 'Should return the correct data', () => {

			const count = 10;
			const filters = { country: uuid() };

			countryList[ 2 ].value = filters.country;

			const output = viewModel( {
				count,
				barriers,
				filters
			} );

			expect( output.count ).toEqual( count );
			expect( output.barriers ).toEqual( getExpectedBarrierOutput( barriers ) );
			expect( output.filters ).toEqual( {
				country: countryList,
				sector: sectorList,
				type: barrierTypeList,
			} );
			expect( countryList[ 2 ].selected ).toEqual( true );
			expect( output.hasFilters ).toEqual( true );
		} );
	} );

	describe( 'With a sector filter', () => {
		it( 'Should return the correct data', () => {

			const count = 5;
			const filters = { sector: uuid() };

			sectorList[ 2 ].value = filters.sector;

			const output = viewModel( {
				count,
				barriers,
				filters
			} );

			expect( output.count ).toEqual( count );
			expect( output.barriers ).toEqual( getExpectedBarrierOutput( barriers ) );
			expect( output.filters ).toEqual( {
				country: countryList,
				sector: sectorList,
				type: barrierTypeList,
			} );
			expect( sectorList[ 2 ].selected ).toEqual( true );
			expect( output.hasFilters ).toEqual( true );
		} );
	} );

	describe( 'With a barrier type filter', () => {
		it( 'Should return the correct data', () => {

			const count = 5;
			const filters = { type: 3 };

			barrierTypeList[ 2 ].value = filters.type;

			const output = viewModel( {
				count,
				barriers,
				filters
			} );

			expect( output.count ).toEqual( count );
			expect( output.barriers ).toEqual( getExpectedBarrierOutput( barriers ) );
			expect( output.filters ).toEqual( {
				country: countryList,
				sector: sectorList,
				type: barrierTypeList.map( ( item ) => {

					if( item.value == filters.type ){
						item.selected = true;
					}

					return item;
				} ),
			} );
			expect( output.hasFilters ).toEqual( true );
		} );
	} );
} );
