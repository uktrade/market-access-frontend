const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = '../../../../../../app/lib/view-models/report/about-problem';

const csrfToken = uuid();
const viewModelResponse = {
	csrfToken,
	losses: [
		{
			value: '1',
			text: 'ut vel et',
			checked: false
		},{
			value: '2',
			text: 'dolores quia iste',
			checked: false
		},{
			value: '3',
			text: 'qui incidunt explicabo',
			checked: false
		},{
			value: '4',
			text: 'velit error blanditiis',
			checked: false
		}
	],
	otherCompanies: [
		{
			value: '1',
			text: 'Yes',
			checked: false
		},{
			value: '2',
			text: 'No',
			checked: false
		},{
			value: '3',
			text: "Don't know",
			checked: false
		}
	]
};

describe( 'Start form view model', () => {

	let viewModel;
	let metadata;

	beforeEach( () => {

		metadata = {
			lossScale: {
				"1": "ut vel et",
				"2": "dolores quia iste",
				"3": "qui incidunt explicabo",
				"4": "velit error blanditiis"
			},
			boolScale: {
				"1": "Yes",
				"2": "No",
				"3": "Don't know"
			}
		};

		viewModel = proxyquire( modulePath, {
			'../../metadata': metadata
		} );
	} );

	describe( 'Without any session values', () => {
		it( 'Should get data and return a view model', () => {

			const model = viewModel( csrfToken );

			expect( model ).toEqual( viewModelResponse );
		} );
	} );

	describe( 'With session values', () => {
		describe( 'With a losses value', () => {
			it( 'Should mark the correct one as checked', () => {

				let model = viewModel( csrfToken, { losses: '2' } );

				expect( model.losses[ 0 ].checked ).toEqual( false );
				expect( model.losses[ 1 ].checked ).toEqual( true );
				expect( model.losses[ 2 ].checked ).toEqual( false );
				expect( model.losses[ 3 ].checked ).toEqual( false );
			} );
		} );

		describe( 'With an otherCompanies value', () => {
			it( 'Should mark the correct one as checked', () => {

				let model = viewModel( csrfToken, { otherCompanies: '3' } );

				expect( model.otherCompanies[ 0 ].checked ).toEqual( false );
				expect( model.otherCompanies[ 1 ].checked ).toEqual( false );
				expect( model.otherCompanies[ 2 ].checked ).toEqual( true );
			} );
		} );
	} );

	describe( 'Creating multiple models', () => {

		it( 'Should only create the radioItems once', () => {

			const radioItemsFromObject = jasmine.createSpy( 'radioItemsFromObject' );

			viewModel = proxyquire( modulePath, {
				'../../metadata': metadata,
				'../../radio-items-from-object': radioItemsFromObject
			} );

			radioItemsFromObject.and.callFake( () => [ {} ] );

			viewModel( csrfToken );

			expect( radioItemsFromObject.calls.count() ).toEqual( 2 );

			viewModel( csrfToken );

			expect( radioItemsFromObject.calls.count() ).toEqual( 2 );

			viewModel( csrfToken );

			expect( radioItemsFromObject.calls.count() ).toEqual( 2 );
		} );
	} );
} );
