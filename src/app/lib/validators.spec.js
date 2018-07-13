const proxyquire = require( 'proxyquire' );
const modulePath = './validators';

describe( 'validators', () => {

	let validators;
	let metadata;

	beforeEach( () => {

		metadata = {
			test1: {
				'test-value-1': 'some value',
				'test-value-2': 'another value'
			},
			countries: [ { id: 'abc-123' }, { id: 'def-456' } ],
			barrierTypes: [ { id: 1 }, { id: 2}, { id: 4 } ]
		};

		validators = proxyquire( modulePath, {
			'./metadata': metadata
		} );
	} );

	describe( 'isDefined', () => {
		describe( 'With an emptry string', () => {
			it( 'Should return false', () => {

				expect( validators.isDefined( '' ) ).toEqual( false );
			} );
		} );

		describe( 'With a string', () => {
			it( 'Shoud return true', () => {

				expect( validators.isDefined( 'test' ) ).toEqual( true );
			} );
		} );

		describe( 'With an undefined value', () => {
			it( 'Return false', () => {

				expect( validators.isDefined() ).toEqual( false );
			} );
		} );
	} );

	describe( 'isUuid', () => {
		describe( 'With a valid uuid', () => {
			it( 'Should return true', () => {

				expect( validators.isUuid( 'abc-123' ) ).toEqual( true );
			} );
		} );

		describe( 'With an invalud uuid', () => {
			it( 'Should return false', () => {

				expect( validators.isUuid( 'abc_123' ) ).toEqual( false );
			} );
		} );
	} );

	describe( 'isMetadata', () => {
		describe( 'When the value exists', () => {
			it( 'Should return true', () => {

				expect( validators.isMetadata( 'test1' )( 'test-value-2' ) ).toEqual( true );
			} );
		} );

		describe( 'When the value exists', () => {
			it( 'Should return true', () => {

				expect( validators.isMetadata( 'test1' )( 'test-value-20' ) ).toEqual( false );
			} );
		} );
	} );

	describe( 'isCountry', () => {
		describe( 'With a valid country', () => {
			it( 'Should return true', () => {

				expect( validators.isCountry( 'abc-123' ) ).toEqual( true );
			} );
		} );

		describe( 'With a valid country', () => {
			it( 'Should return true', () => {

				expect( validators.isCountry( 'xyz-123' ) ).toEqual( false );
			} );
		} );
	} );

	describe( 'isOneBoolCheckboxChecked', () => {
		describe( 'When one value is true', () => {
			it( 'Should return true', () => {

				expect( validators.isOneBoolCheckboxChecked( {
					a: 'blah',
					b: 'true',
					c: 'bar'
				} ) ).toEqual( true );
			} );
		} );

		describe( 'When no values are true', () => {
			it( 'Should return false', () => {

				expect( validators.isOneBoolCheckboxChecked( {
					a: 'foo',
					b: 'baz',
					c: 'bar'
				} ) ).toEqual( false );
			} );
		} );
	} );

	describe( 'isBarrierType', () => {
		describe( 'With a valid country', () => {
			describe( 'With the id as a string', () => {
				it( 'Should return true', () => {

					expect( validators.isBarrierType( '4' ) ).toEqual( true );
				} );
			} );

			describe( 'With the id as a number', () => {
				it( 'Should return true', () => {

					expect( validators.isBarrierType( 4 ) ).toEqual( true );
				} );
			} );
		} );

		describe( 'With a valid country', () => {
			it( 'Should return true', () => {

				expect( validators.isBarrierType( 'xyz' ) ).toEqual( false );
			} );
		} );
	} );

	describe( 'isDateValue', () => {
		describe( 'With a valid date value', () => {
			it( 'Should return true', () => {

				expect( validators.isDateValue( 'day' )( { day: '02' } ) ).toEqual( true );
			} );
		} );

		describe( 'With an invalid date value', () => {
			it( 'Should return false', () => {

				expect( validators.isDateValue( 'day' )( { day: '' } ) ).toEqual( false );
				expect( validators.isDateValue( 'day' )( {} ) ).toEqual( false );
			} );
		} );
	} );

	describe( 'isDateValid', () => {
		describe( 'With a valid date', () => {
			it( 'Should return true', () => {

				expect( validators.isDateValid( { year: '2016', month: '01', day: '01' } ) ).toEqual( true );
			} );
		} );

		describe( 'With an invalid date', () => {
			it( 'Should return false', () => {

				expect( validators.isDateValid( { year: '2016', month: '20', day: '01' } ) ).toEqual( false );
			} );
		} );
	} );

	describe( 'isDateInPast', () => {
		describe( 'With a valid date', () => {
			describe( 'When the date is in the past', () => {
				it( 'Should return true', () => {

					expect( validators.isDateInPast( { year: '2016', month: '01', day: '01' } ) ).toEqual( true );
				} );
			} );

			describe( 'When the date is in the future', () => {
				it( 'Should return false', () => {

					expect( validators.isDateInPast( { year: '2050', month: '01', day: '01' } ) ).toEqual( false );
				} );
			} );
		} );

		describe( 'With an invalid date', () => {
			it( 'Should return false', () => {

				expect( validators.isDateInPast( { year: '2016', month: '20', day: '01' } ) ).toEqual( false );
			} );
		} );
	} );
} );
