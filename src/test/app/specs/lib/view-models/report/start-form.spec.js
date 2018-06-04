const proxyquire = require( 'proxyquire' );
const modulePath = '../../../../../../app/lib/view-models/report/start-form';

const metadataStatusTypes = {
	type1: 'a type',
	type2: 'another type'
};

const viewModelResponse = {

	statusTypes: [
		{
			value: 'type1',
			text: 'a type'
		},{
			value: 'type2',
			text: 'another type'
		}
	],
	emergencyTypes: [
		{
			'value': 'yes',
			'text': "Yes"
		},
		{
			'value': 'no',
			'text': "No"
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

	describe( 'The first call for the view model', () => {

		it( 'Should get data and return a view model', () => {

			const model = viewModel();

			expect( metadata.getStatusTypes ).toHaveBeenCalled();
			expect( model ).toEqual( viewModelResponse );
		} );
	} );

	describe( 'After the first call', () => {

		it( 'Should return the view model without fetching data', () => {

			let model = viewModel();

			expect( metadata.getStatusTypes.calls.count() ).toEqual( 1 );
			expect( model ).toEqual( viewModelResponse );

			model = viewModel();

			expect( metadata.getStatusTypes.calls.count() ).toEqual( 1 );
			expect( model ).toEqual( viewModelResponse );
		} );
	} );
} );
