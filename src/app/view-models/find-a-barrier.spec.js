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

	function getExpectedBarrierOutput( barriers ){

		const expected = [];

		for( let barrier of barriers ){

			const sectors = ( barrier.sectors ? barrier.sectors.map( () => mockSector ) : [] );
			const barrierStatusCode = barrier.current_status.status;
			const status = metadata.barrier.status.typeInfo[ barrierStatusCode ] || {};

			expected.push({
				id: barrier.id,
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
					status: barrier.current_status.status_date
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
			getCountryList: jasmine.createSpy( 'metadata.getCountryList' )
		};

		mockSector = { id: uuid(), name: faker.lorem.words() };
		mockCountry = { id: uuid(), name: faker.address.country() };
		barriers = jasmine.helpers.getFakeData( '/backend/barriers/find-a-barrier' );

		metadata.getSector.and.callFake( () => mockSector );
		metadata.getCountry.and.callFake( () => mockCountry );

		viewModel = proxyquire( modulePath, {
			'../lib/metadata': metadata
		} );
	} );

	describe( 'Without any filters', () => {
		it( 'Should return the correct data', () => {

			const count = 20;
			const filters = {};

			const countryList = [
				{ value: uuid(), name: faker.address.country() },
				{ value: uuid(), name: faker.address.country() },
				{ value: uuid(), name: faker.address.country() },
			];

			metadata.getCountryList.and.callFake( () => countryList );

			const output = viewModel( {
				count,
				barriers,
				filters
			} );

			expect( output.count ).toEqual( count );
			expect( output.barriers ).toEqual( getExpectedBarrierOutput( barriers ) );
			expect( output.filters ).toEqual( {	country: countryList	} );
			expect( metadata.getCountryList ).toHaveBeenCalledWith( 'All locations' );
			expect( output.hasFilters ).toEqual( false );
		} );
	} );

	describe( 'With a country filter', () => {
		it( 'Should return the correct data', () => {

			const count = 10;
			const filters = {
				country: uuid()
			};

			const countryList = [
				{ value: uuid(), name: faker.address.country() },
				{ value: uuid(), name: faker.address.country() },
				{ value: filters.country, name: faker.address.country() },
			];

			metadata.getCountryList.and.callFake( () => countryList );

			const output = viewModel( {
				count,
				barriers,
				filters
			} );

			expect( output.count ).toEqual( count );
			expect( output.barriers ).toEqual( getExpectedBarrierOutput( barriers ) );
			expect( output.filters ).toEqual( {	country: countryList	} );
			expect( countryList[ 2 ].selected ).toEqual( true );
			expect( metadata.getCountryList ).toHaveBeenCalledWith( 'All locations' );
			expect( output.hasFilters ).toEqual( true );
		} );
	} );
} );
