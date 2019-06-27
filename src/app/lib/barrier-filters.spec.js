const proxyquire = require( 'proxyquire' );
const faker = require( 'faker' );
const uuid = require( 'uuid/v4' );
const modulePath = './barrier-filters';

const validatorNames = [
	'isCountryOrAdminArea',
	'isSector',
	'isBarrierType',
	'isBarrierPriority',
	'isOverseasRegion',
];

const keyMap = {
	country: 'isCountryOrAdminArea',
	sector: 'isSector',
	type: 'isBarrierType',
	priority: 'isBarrierPriority',
	region: 'isOverseasRegion',
};

describe( 'barrier-filters', () => {

	let validators;
	let barrierFilters;

	beforeEach( () => {

		validators = {};

		validatorNames.forEach( ( name ) => {
			validators[ name ] = jasmine.createSpy( `validators.${ name }` );
		} );

		barrierFilters = proxyquire( modulePath, {
			'./validators': validators
		} );
	} );

	describe( '#FILTERS', () => {
		it( 'Exports a list of valid filters with validators', () => {

			//convert array back to object for easy testing
			const filtersObject = barrierFilters.FILTERS.reduce( ( obj, { 0: key, 1: value } ) => ({ ...obj, ...{ [ key ]: value } }), {} );

			for( let [ filterKey, validatorKey ] of Object.entries( keyMap ) ){

				expect( filtersObject[ filterKey ] ).toEqual( validators[ validatorKey ] );
			}

			expect( typeof filtersObject.search ).toEqual( 'function' );
		} );
	} );

	describe( '#getFromQueryString', () => {

		let query;

		beforeEach( () => {

			query = {
				country: String( uuid() ),
				sector: String( uuid() ),
				type: String( faker.random.number() ),
				priority: String( faker.random.number( { min: 0, max: 5 } ) ),
				region: String( uuid() ),
				search: String( faker.lorem.words( 3 ) ),
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
} );
