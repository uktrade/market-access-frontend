const proxyquire = require( 'proxyquire' );
const modulePath = './strings';

describe( 'strings', () => {

	let strings;
	let metadata;

	beforeEach( () => {

		const countries = [
			{ id: 'c-id-1', name: 'usa' },
			{ id: 'c-id-2', name: 'canada' },
		];

		const adminAreas = [
			{ id: 'a-id-1', name: 'california', country: countries[ 0 ] },
			{ id: 'a-id-2', name: 'colorado', country: countries[ 0 ] },
			{ id: 'a-id-3', name: 'calgary', country: countries[ 1 ] },
		];

		const priorities = [
			{ id: 'p-id-1', name: 'priority 1' },
			{ id: 'p-id-2', name: 'priority 2' },
		];

		const types = [
			{ id: 't-id-1', title: 'type 1' },
			{ id: 't-id-2', title: 'type 2' },
		];

		const regions = [
			{ id: 'r-id-1', name: 'region 1' },
			{ id: 'r-id-2', name: 'region 2' },
		];

		const sectors = [
			{ id: 's-id-1', name: 'sector 1' },
			{ id: 's-id-2', name: 'sector 2' },
		];

		metadata = {
			getCountry: jasmine.createSpy( 'metadata.getCountry' ).and.callFake( ( id ) => countries.find( ( country ) => country.id === id ) ),
			getAdminArea: jasmine.createSpy( 'metadata.getAdminArea' ).and.callFake( ( id ) => adminAreas.find( ( area ) => area.id === id ) ),
			getOverseasRegion: jasmine.createSpy( 'metadata.getOverseasRegion' ).and.callFake( ( id ) => regions.find( ( region ) => region.id === id ) ),
			getSector: jasmine.createSpy( 'metadata.getSector' ).and.callFake( ( id ) => sectors.find( ( sector ) => sector.id === id ) ),
			getBarrierType: jasmine.createSpy( 'metadata.getBarrierType' ).and.callFake( ( id ) => types.find( ( type ) => type.id === id ) ),
			getBarrierPriority: jasmine.createSpy( 'metadata.getBarrierPriority' ).and.callFake( ( id ) => priorities.find( ( priority ) => priority.id === id ) ),
		};

		strings = proxyquire( modulePath, {
			'./metadata': metadata,
		} );
	} );

	describe( 'location', () => {
		describe( 'Without any params', () => {
			it( 'Should not error', () => {

				expect( () => strings.location() ).not.toThrow();
			} );
		} );

		describe( 'With only a country', () => {
			it( 'Should return the correct country name', () => {

				expect( strings.location( 'c-id-1' ) ).toEqual( 'usa' );
			} );
		} );

		describe( 'With a country and matching admin areas', () => {
			it( 'Should return the correct coutnry and admin areas', () => {

				expect( strings.location( 'c-id-1', [ 'a-id-1' ] ) ).toEqual( 'california (usa)' );
			} );
		} );

		describe( 'With a country and non matching admin areas', () => {
			it( 'Should return the correct coutnry and admin areas', () => {

				expect( strings.location( 'c-id-1', [ 'a-id-100' ] ) ).toEqual( 'usa' );
			} );
		} );
	} );

	describe( 'locations', () => {
		describe( 'Without and ids', () => {
			it( 'Should not error', () => {
				expect( () => strings.locations() ).not.toThrow();
			} );
		} );

		describe( 'With ids', () => {
			it( 'Should return the correct string', () => {

				expect( strings.locations( [ 'c-id-1' ] ) ).toEqual( 'usa' );
				expect( strings.locations( [ 'c-id-1', 'c-id-2' ] ) ).toEqual( 'usa, canada' );
				expect( strings.locations( [ 'a-id-1', 'c-id-2' ] ) ).toEqual( 'california (usa), canada' );
				expect( strings.locations( [ 'c-id-1', 'a-id-3' ] ) ).toEqual( 'calgary (canada), usa' );
				expect( strings.locations( [ 'a-id-1', 'c-id-1', 'c-id-2' ] ) ).toEqual( 'california (usa), usa, canada' );
				expect( strings.locations( [ 'a-id-1', 'a-id-2', 'c-id-2' ] ) ).toEqual( 'california, colorado (usa), canada' );
				expect( strings.locations( [ 'a-id-1', 'a-id-2', 'a-id-3' ] ) ).toEqual( 'california, colorado (usa), calgary (canada)' );
				expect( strings.locations( [ 'a-id-1', 'a-id-2', 'a-id-3', 'c-id-1', 'c-id-2' ] ) ).toEqual( 'california, colorado (usa), calgary (canada), usa, canada' );
			} );
		} );
	} );

	describe( 'regions', () => {
		describe( 'Without any ids', () => {
			it( 'Should not error', () => {
				expect( () => strings.regions() ).not.toThrow();
			} );
		} );

		describe( 'With ids', () => {
			it( 'Should return the correct string', () => {
				expect( strings.regions( [ 'r-id-1' ] ) ).toEqual( 'region 1' );
				expect( strings.regions( [ 'r-id-1', 'r-id-2' ] ) ).toEqual( 'region 1, region 2' );
			} );
		} );
	} );

	describe( 'types', () => {
		describe( 'Without any ids', () => {
			it( 'Should not error', () => {
				expect( () => strings.types() ).not.toThrow();
			} );
		} );

		describe( 'With ids', () => {
			it( 'Should return the correct string', () => {
				expect( strings.types( [ 't-id-1' ] ) ).toEqual( 'type 1' );
				expect( strings.types( [ 't-id-1', 't-id-2' ] ) ).toEqual( 'type 1, type 2' );
			} );
		} );
	} );

	describe( 'priorities', () => {
		describe( 'Without any ids', () => {
			it( 'Should not error', () => {
				expect( () => strings.priorities() ).not.toThrow();
			} );
		} );

		describe( 'With ids', () => {
			it( 'Should return the correct string', () => {
				expect( strings.priorities( [ 'p-id-1' ] ) ).toEqual( 'priority 1' );
				expect( strings.priorities( [ 'p-id-1', 'p-id-2' ] ) ).toEqual( 'priority 1, priority 2' );
			} );
		} );
	} );

	describe( 'sectors', () => {
		describe( 'Without any ids', () => {
			it( 'Should not error', () => {
				expect( () => strings.sectors() ).not.toThrow();
				expect( strings.sectors() ).toEqual( 'Unknown' );
			} );
		} );

		describe( 'With ids', () => {
			it( 'Should return the correct string', () => {
				expect( strings.sectors( [ 's-id-1' ] ) ).toEqual( 'sector 1' );
				expect( strings.sectors( [ 's-id-1', 's-id-2' ] ) ).toEqual( 'sector 1, sector 2' );
			} );
		} );
		describe( 'With all sectors', () => {
			it( 'Should return the correct string', () => {
				expect( strings.sectors( [], true ) ).toEqual( 'All sectors' );
			});
		});
	} );
} );
