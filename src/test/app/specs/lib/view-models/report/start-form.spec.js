const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = '../../../../../../app/lib/view-models/report/start-form';

const metadataStatusTypes = {
	type1: 'a type',
	type2: 'another type'
};

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
			value: 'yes',
			text: 'Yes',
			checked: false
		},
		{
			value: 'no',
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
			getStatusTypes: jasmine.createSpy( 'metadata.getStatusTypes' )
		};

		metadata.getStatusTypes.and.callFake( () => metadataStatusTypes );

		viewModel = proxyquire( modulePath, {
			'../../metadata': metadata
		} );
	} );

	describe( 'Without any session values', () => {
		describe( 'The first call for the view model', () => {
			it( 'Should get data and return a view model', () => {

				const model = viewModel( csrfToken );

				expect( metadata.getStatusTypes ).toHaveBeenCalled();
				expect( model ).toEqual( viewModelResponse );
			} );
		} );

		describe( 'After the first call', () => {
			it( 'Should return the view model without fetching data', () => {

				let model = viewModel( csrfToken );

				expect( metadata.getStatusTypes.calls.count() ).toEqual( 1 );
				expect( model ).toEqual( viewModelResponse );

				model = viewModel( csrfToken );

				expect( metadata.getStatusTypes.calls.count() ).toEqual( 1 );
				expect( model ).toEqual( viewModelResponse );
			} );
		} );
	} );


	describe( 'With session values', () => {
		describe( 'With a session value', () => {
			it( 'Should mark the correct one as checked', () => {

				let model = viewModel( csrfToken, { status: 'type2' } );

				expect( model.statusTypes[ 0 ].checked ).toEqual( false );
				expect( model.statusTypes[ 1 ].checked ).toEqual( true );
			} );
		} );

		describe( 'With an emergency value', () => {
			it( 'Should mark the correct one as checked', () => {

				let model = viewModel( csrfToken, { emergency: 'no' } );

				expect( model.emergencyTypes[ 0 ].checked ).toEqual( false );
				expect( model.emergencyTypes[ 1 ].checked ).toEqual( true );
			} );
		} );
	} );
} );
