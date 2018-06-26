const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = '../../../../../../app/lib/view-models/report/start-form';

const csrfToken = uuid();

const viewModelResponse = {
	csrfToken,
	statusTypes: [
		{
			value: 'type1',
			text: 'a type',
			checked: false
		},{
			value: 'type2',
			text: 'another type',
			checked: false
		}
	],
	emergencyTypes: [
		{
			value: 'true',
			text: 'Yes',
			checked: false
		},
		{
			value: 'false',
			text: 'No',
			checked: false
		}
	]
};

describe( 'Start form view model', () => {

	let viewModel;
	let metadata;

	beforeEach( () => {

		metadata = {
			statusTypes: {
				'type1': 'a type',
				'type2': 'another type'
			},
			bool: {
				'true': 'Yes',
				'false': 'No'
			}
		};

		viewModel = proxyquire( modulePath, {
			'../../metadata': metadata
		} );
	} );

	describe( 'Without any values', () => {
		it( 'Should get data and return a view model', () => {

			const model = viewModel( csrfToken );

			expect( model ).toEqual( viewModelResponse );
		} );
	} );


	describe( 'With session values', () => {
		describe( 'With a session value', () => {
			it( 'Should mark the correct one as checked', () => {

				let model = viewModel( csrfToken, {}, { status: 'type2' } );

				expect( model.statusTypes[ 0 ].checked ).toEqual( false );
				expect( model.statusTypes[ 1 ].checked ).toEqual( true );
			} );
		} );

		describe( 'With an emergency value', () => {
			it( 'Should mark the correct one as checked', () => {

				let model = viewModel( csrfToken, {}, { emergency: 'false' } );

				expect( model.emergencyTypes[ 0 ].checked ).toEqual( false );
				expect( model.emergencyTypes[ 1 ].checked ).toEqual( true );
			} );
		} );
	} );
} );
