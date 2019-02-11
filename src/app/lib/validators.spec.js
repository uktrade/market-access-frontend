const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
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
			barrierTypes: [ { id: 1 }, { id: 2}, { id: 4 } ],
			sectors: [ { id: uuid() }, { id: uuid() } ],
			barrierPriorities: [ { code: 'abc', name: 'test 1' }, { code: 'def', name: 'test 2' } ],
		};

		validators = proxyquire( modulePath, {
			'./metadata': metadata
		} );
	} );

	describe( 'isNumeric', () => {
		describe( 'With a number', () => {
			it( 'Shoud return true', () => {

				expect( validators.isNumeric( '1' ) ).toEqual( true );
			} );
		} );

		describe( 'With a number and a character', () => {
			it( 'Should return false', () => {

				expect( validators.isNumeric( '12a' ) ).toEqual( false );
			} );
		} );
	} );

	describe( 'isDefined', () => {
		describe( 'With an emptry string', () => {
			it( 'Should return false', () => {

				expect( validators.isDefined( '' ) ).toEqual( false );
			} );
		} );

		describe( 'With a string of spaces', () => {
			it( 'Should return false', () => {

				expect( validators.isDefined( '  ' ) ).toEqual( false );
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

	describe( 'isSector', () => {
		describe( 'With a valid country', () => {
			it( 'Should return true', () => {

				expect( validators.isSector( metadata.sectors[ 0 ].id ) ).toEqual( true );
			} );
		} );

		describe( 'With a valid country', () => {
			it( 'Should return true', () => {

				expect( validators.isSector( 'xyz-123' ) ).toEqual( false );
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
			describe( 'When there is a year, month and day', () => {
				it( 'Should return true', () => {

					expect( validators.isDateValid( { year: '2016', month: '01', day: '01' } ) ).toEqual( true );
				} );
			} );
			describe( 'When there is a year and month', () => {
				it( 'Should return true', () => {

					expect( validators.isDateValid( { year: '2016', month: '01' } ) ).toEqual( true );
				} );
			} );
		} );

		describe( 'With an invalid date', () => {
			describe( 'When there is a year, month and day', () => {
				it( 'Should return false', () => {

					expect( validators.isDateValid( { year: '2016', month: '20', day: '01' } ) ).toEqual( false );
				} );
			} );
			describe( 'When there is a year and month', () => {
				it( 'Should return false', () => {

					expect( validators.isDateValid( { year: '2016', month: '20' } ) ).toEqual( false );
				} );
			} );
		} );
	} );

	describe( 'isDateInPast', () => {
		describe( 'With a valid date', () => {
			describe( 'When the date is in the past', () => {
				describe( 'When there is a year, month and day', () => {
					it( 'Should return true', () => {

						expect( validators.isDateInPast( { year: '2016', month: '01', day: '01' } ) ).toEqual( true );
					} );
				} );
				describe( 'When there is a year and month', () => {
					it( 'Should return true', () => {

						expect( validators.isDateInPast( { year: '2016', month: '01' } ) ).toEqual( true );
					} );
				} );
			} );

			describe( 'When the date is in the future', () => {
				describe( 'When there is a year, month and day', () => {
					it( 'Should return false', () => {

						expect( validators.isDateInPast( { year: '2050', month: '01', day: '01' } ) ).toEqual( false );
					} );
				} );
				describe( 'When there is a year and month', () => {
					it( 'Should return false', () => {

						expect( validators.isDateInPast( { year: '2050', month: '01' } ) ).toEqual( false );
					} );
				} );
			} );
		} );

		describe( 'With an invalid date', () => {
			describe( 'When there is a year, month and day', () => {
				it( 'Should return false', () => {

					expect( validators.isDateInPast( { year: '2016', month: '20', day: '01' } ) ).toEqual( false );
				} );
			} );
			describe( 'When there is a year and month', () => {
				it( 'Should return false', () => {

					expect( validators.isDateInPast( { year: '2016', month: '20' } ) ).toEqual( false );
				} );
			} );
		} );
	} );

	describe( 'isDateNumeric', () => {
		describe( 'When there is only a year and month', () => {
			describe( 'When both month and year are numbers', () => {
				it( 'Should return true', () => {

					expect( validators.isDateNumeric( { year: '2000', month: '10' } ) ).toEqual( true );
				} );
			} );

			describe( 'When month is a number but year is not', () => {
				it( 'Should return false', () => {

					expect( validators.isDateNumeric( { year: 'abc', month: '10' } ) ).toEqual( false );
				} );
			} );

			describe( 'When year is a number but month is not', () => {
				it( 'Should return false', () => {

					expect( validators.isDateNumeric( { year: '2000', month: 'abc' } ) ).toEqual( false );
				} );
			} );
		} );

		describe( 'When there is a year, month and day', () => {
			describe( 'When all are numbers', () => {
				it( 'Should return true', () => {

					expect( validators.isDateNumeric( { year: '2000', month: '10', day: '01' } ) ).toEqual( true );
				} );
			} );

			describe( 'When day and month are numbers but year is not', () => {
				it( 'Should return false', () => {

					expect( validators.isDateNumeric( { year: 'abc', month: '10', day: '01' } ) ).toEqual( false );
				} );
			} );

			describe( 'When year and day are numbers but month is not', () => {
				it( 'Should return false', () => {

					expect( validators.isDateNumeric( { year: '2000', month: 'abc', day: '01' } ) ).toEqual( false );
				} );
			} );

			describe( 'When year and month are numbers but day is not', () => {
				it( 'Should return false', () => {

					expect( validators.isDateNumeric( { year: '2000', month: '10', day: 'abc' } ) ).toEqual( false );
				} );
			} );
		} );
	} );

	describe( 'isBarrierPriority', () => {
		describe( 'With a valid priority', () => {
			it( 'Should return true', () => {

				expect( validators.isBarrierPriority( 'abc' ) ).toEqual( true );
			} );
		} );

		describe( 'Without a valid priority', () => {
			it( 'Should return false', () => {

				expect( validators.isBarrierPriority( 'xyz' ) ).toEqual( false );
			} );
		} );
	} );
} );
