const proxyquire = require( 'proxyquire' );
const faker = require( 'faker' );
const uuid = require( 'uuid/v4' );
const modulePath = './barrier-filters';

const { mocks } = jasmine.helpers;

const validatorNames = [
	'isCountryOrAdminArea',
	'isSector',
	'isBarrierType',
	'isBarrierPriority',
	'isOverseasRegion',
	'isBarrierStatus',
	'isCreatedBy',
];

const keyMap = {
	country: 'isCountryOrAdminArea',
	sector: 'isSector',
	type: 'isBarrierType',
	priority: 'isBarrierPriority',
	region: 'isOverseasRegion',
	status: 'isBarrierStatus',
	createdBy: 'isCreatedBy',
};

const stringMap = {
	country: 'locations',
	sector: 'sectors',
	type: 'types',
	priority: 'priorities',
	region: 'regions',
	status: 'statuses',
	createdBy: 'createdBy',
};

const labelMap = {
	country: 'Barrier location',
	sector: 'Sector',
	type: 'Barrier type',
	priority: 'Barrier priority',
	region: 'Overseas region',
	status: 'Barrier status',
	search: 'Search',
	createdBy: 'Show only',
};

describe( 'barrier-filters', () => {

	let validators;
	let strings;
	let barrierFilters;
	let reporter;

	beforeEach( () => {

		validators = {};
		strings = mocks.strings();
		reporter = mocks.reporter();

		validatorNames.forEach( ( name ) => {
			validators[ name ] = jasmine.createSpy( `validators.${ name }` );
		} );

		barrierFilters = proxyquire( modulePath, {
			'./validators': validators,
			'./strings': strings,
			'./reporter': reporter,
		} );
	} );

	describe( '#getDisplayInfo', () => {
		describe( 'When there is a string fn to convert the value', () => {
			it( 'Uses the string function', () => {

				Object.entries( stringMap ).forEach( ( [ key, stringName ] ) => {

					const id = uuid();
					const value = barrierFilters.getDisplayInfo( key, id );
					const stringFn = strings[ stringName ];

					expect( stringFn ).toHaveBeenCalledWith( id );
					expect( value ).toEqual( { label: labelMap[ key ], text: stringFn.response } );
				} );
			} );
		} );

		describe( 'When there is NOT a string fn to convert the value', () => {
			it( 'Returns the value', () => {

				const id = uuid();
				const value = barrierFilters.getDisplayInfo( 'a', id );

				expect( value ).toEqual( undefined );
				expect( reporter.captureException ).toHaveBeenCalled();
			} );
		} );
	} );

	describe( '#getFromQueryString', () => {

		let query;

		beforeEach( () => {

			query = {
				country:  uuid(),
				sector:  uuid(),
				type: String( faker.random.number() ),
				priority: String( faker.random.number( { min: 0, max: 5 } ) ),
				region: uuid(),
				search: faker.lorem.words( 3 ),
				status: '2',
				createdBy: '1'
			};

			validatorNames.forEach( ( name ) => validators[ name ].and.callFake( () => true ) );
		} );

		describe( 'When all filters are valid', () => {
			it( 'Returns all the filters', () => {

				const filters = barrierFilters.getFromQueryString( query );

				Object.entries( query ).forEach( ( [ key, value ] ) => expect( filters[ key ] ).toEqual( [ value ] ) );
				Object.entries( keyMap ).forEach( ( [ queryName, validatorName ] ) => {

					const validatorFn = validators[ validatorName ];
					const queryValue = query[ queryName ];
					const values = queryValue.split(',');

					expect( validatorFn ).toHaveBeenCalled();

					for( let i = 0, l = values.length; i < l; i++ ){
						expect( validatorFn.calls.argsFor( i )[ 0 ] ).toEqual( values[ i ] );
					}
				} );
			} );
		} );

		describe( 'When some filters are not valid', () => {
			it( 'Returns only the valid filters', () => {

				const invalidNames = [ 'country', 'region' ];

				invalidNames.forEach( ( name ) => validators[ keyMap[ name ] ].and.callFake( () => false ) );

				const filters = barrierFilters.getFromQueryString( query );

				invalidNames.forEach( ( name ) => expect( filters[ name ] ).not.toBeDefined() );

				Object.entries( filters ).forEach( ( [ name, value ] ) => {

					expect( invalidNames.includes( name ) ).toEqual( false );
					expect( value ).toEqual( [ query[ name ] ] );
				} );
			} );
		} );

		describe( 'Multiple values', () => {

			let priority;

			describe( 'As an array', () => {
				describe( 'When one priority is valid and one is not', () => {
					it( 'Should render the template with a filter', () => {

						const priority = [ 'ABC', 'DEF' ];
						const validPriorities = priority;
						const invalidPriority = 'GHI';

						query = { priority: validPriorities.concat( [ invalidPriority ] ) };

						validators.isBarrierPriority.and.callFake( ( value ) => {

							if( validPriorities.includes( value ) ){ return true; }

							return false;
						} );

						const filters = barrierFilters.getFromQueryString( query );

						expect( filters ).toEqual( { priority: validPriorities } );
					} );
				} );
			} );

			describe( 'As a csv', () => {

				beforeEach( () => {
					priority = [ 'ABC', 'DEF' ];
					query = { priority: priority.join( ',' ) };
				} );

				describe( 'When all priorities are valid', () => {
					it( 'Should render the template with a filter', () => {

						validators.isBarrierPriority.and.callFake( () => true );

						const filters = barrierFilters.getFromQueryString( query );

						expect( filters ).toEqual( { priority } );
					} );
				} );

				describe( 'When all priorities are NOT valid', () => {
					it( 'Should render the template without filters', () => {

						validators.isBarrierPriority.and.callFake( () => false );

						const filters = barrierFilters.getFromQueryString( query );

						expect( filters ).toEqual( {} );
					} );
				} );

				describe( 'When one priority is valid and one is not', () => {
					it( 'Should render the template with a filter', () => {

						const validPriorities = priority;
						const invalidPriority = faker.lorem.word().toUpperCase();

						query.priority = validPriorities.concat( [ invalidPriority ] ).join( ',' );

						validators.isBarrierPriority.and.callFake( ( value ) => {

							if( validPriorities.includes( value ) ){ return true; }

							return false;
						} );

						const filters = barrierFilters.getFromQueryString( query );

						expect( filters ).toEqual( { priority: validPriorities } );
					} );
				} );
			} );
		} );
	} );

	describe( '#areEqual', () => {
		describe( 'When valid keys have matching values', () => {
			it( 'It should return true', () => {

				expect( barrierFilters.areEqual( { a: 1, b: 2 }, { a: 3, b: 4 } ) ).toEqual( true );
				expect( barrierFilters.areEqual( { a: 1, b: 2 }, { a: 1, b: 2 } ) ).toEqual( true );
				expect( barrierFilters.areEqual( { country: 1, b: 2 }, { country: 1, b: 3 } ) ).toEqual( true );
			} );
		} );

		describe( 'When valid keys have non matching values', () => {
			it( 'It should return false', () => {

				expect( barrierFilters.areEqual( { country: 1 }, { country: 2 } ) ).toEqual( false );
				expect( barrierFilters.areEqual( { country: [ uuid() ] }, { country: [ uuid() ] } ) ).toEqual( false );
			} );
		} );
	} );
} );
