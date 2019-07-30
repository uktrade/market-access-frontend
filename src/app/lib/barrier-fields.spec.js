const proxyquire = require( 'proxyquire' );

const GROUP = 'test-group';

describe( 'Barrier fields', () => {

	let Form;
	let validators;
	let barrierFields;

	beforeEach( () => {

		Form = jasmine.createSpy( 'Form' );
		Form.GROUP = GROUP;

		validators = {
			isDateValue: jasmine.createSpy( 'validators.isDateValue' ),
			isDateNumeric: jasmine.createSpy( 'validators.isDateNumeric' ),
			isDateValid: jasmine.createSpy( 'validators.isDateValid' ),
			isDateInPast: jasmine.createSpy( 'validators.isDateInPast' ),
		};

		barrierFields = proxyquire( './barrier-fields', {
			'./Form': Form,
			'./validators': validators,
		} );
	} );

	describe( '#createStatusDate', () => {

		let monthValidator;
		let yearValidator;
		let month;
		let year;

		beforeEach( () => {

			monthValidator = jasmine.createSpy( 'isDateValue -> month' );
			yearValidator = jasmine.createSpy( 'isDateValue -> year' );

			validators.isDateValue.and.callFake( ( name ) => {

				if( name === 'month' || name === 'myMonth' ){ return monthValidator; }
				if( name === 'year' || name === 'myYear' ){ return yearValidator; }
			} );

			month = '03';
			year = '2019';
		} );

		describe( 'With no params', () => {
			it( 'Returns the correct field data', () => {

				const parts = {
					month,
					year,
				};

				const field = barrierFields.createStatusDate();

				expect( field ).toBeDefined();
				expect( field.type ).toEqual( GROUP );
				expect( field.items ).toEqual( { month: { values: [ undefined ] }, year: { values: [ undefined ] } } );

				field.validators[ 2 ].fn( parts );
				field.validators[ 3 ].fn( parts );
				field.validators[ 4 ].fn( parts );

				expect( field.validators[ 0 ].fn ).toEqual( monthValidator );
				expect( field.validators[ 1 ].fn ).toEqual( yearValidator );
				expect( validators.isDateNumeric ).toHaveBeenCalledWith( { month, year } );
				expect( validators.isDateValid ).toHaveBeenCalledWith( { month, year } );
				expect( validators.isDateInPast ).toHaveBeenCalledWith( { month, year } );
			} );
		} );

		describe( 'With params', () => {
			it( 'Returns the correct field data', () => {

				const parts = {
					myMonth: month,
					myYear: year,
				};

				const dateValues = {
					myMonth: '10',
					myYear: '2020',
				};

				const field = barrierFields.createStatusDate( dateValues, 'myMonth', 'myYear' );

				expect( field ).toBeDefined();
				expect( field.type ).toEqual( GROUP );
				expect( field.items ).toEqual( {
					myMonth: { values: [ dateValues.myMonth ] },
					myYear: { values: [ dateValues.myYear ] }
				} );

				field.validators[ 2 ].fn( parts );
				field.validators[ 3 ].fn( parts );
				field.validators[ 4 ].fn( parts );

				expect( field.validators[ 0 ].fn ).toEqual( monthValidator );
				expect( field.validators[ 1 ].fn ).toEqual( yearValidator );
				expect( validators.isDateNumeric ).toHaveBeenCalledWith( { month, year } );
				expect( validators.isDateValid ).toHaveBeenCalledWith( { month, year } );
				expect( validators.isDateInPast ).toHaveBeenCalledWith( { month, year } );
			} );
		} );
	} );
} );
