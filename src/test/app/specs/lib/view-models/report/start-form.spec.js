const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = '../../../../../../app/lib/view-models/report/start-form';

const csrfToken = uuid();
const radioItemsResponse = [
	{ value: 'type1', text: 'a type' },
	{ value: 'type2', text: 'another type' }
];

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
	let radioItemsFromObject;

	beforeEach( () => {

		metadata = {
			statusTypes: [ { '1': 'status' } ]
		};

		radioItemsFromObject = jasmine.createSpy( 'radioItemsFromObject' );

		radioItemsFromObject.and.callFake( () => radioItemsResponse );

		viewModel = proxyquire( modulePath, {
			'../../metadata': metadata,
			'../../radio-items-from-object': radioItemsFromObject
		} );
	} );

	describe( 'Without any session values', () => {
		it( 'Should get data and return a view model', () => {

			const model = viewModel( csrfToken );

			expect( model ).toEqual( viewModelResponse );
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
