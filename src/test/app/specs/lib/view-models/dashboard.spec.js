const proxyquire = require( 'proxyquire' );
const modulePath = '../../../../../app/lib/view-models/dashboard';

describe( 'Dashboard view model', () => {

	let viewModel;
	let metadata;

	beforeEach( () => {

		metadata = {
			statusTypes: {
				'1': 'test',
				'2': 'testing',
				'3': 'more tests'
			}
		};

		viewModel = proxyquire( modulePath, {
			'../metadata': metadata
		} );
	} );

	describe( 'When there are some reports', () => {

		it( 'Should transform them', () => {

			const reports = [
				{
					problem_status: '1',
					is_emergency: true
				},{
					problem_status: '2',
					is_emergency: true
				},{
					problem_status: '3',
					is_emergency: false
				}
			];

			viewModel( reports );

			expect( reports[ 0 ].problem_status ).toEqual( {
				id: '1',
				name: 'test',
				isEmergency: true
			} );

			expect( reports[ 1 ].problem_status ).toEqual( {
				id: '2',
				name: 'testing',
				isEmergency: true
			} );

			expect( reports[ 2 ].problem_status ).toEqual( {
				id: '3',
				name: 'more tests',
				isEmergency: false
			} );
		} );
	} );

	describe( 'When the list of reports is empty', () => {

		it( 'Should return the reports', () => {

			const input = [];
			const output = viewModel( input );

			expect( output ).toEqual( { reports: input } );
		} );
	} );
} );
