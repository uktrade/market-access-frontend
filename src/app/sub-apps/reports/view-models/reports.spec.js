const proxyquire = require( 'proxyquire' );
const modulePath = './reports';

describe( 'Reports view model', () => {

	let viewModel;
	let metadata;

	function getCountry(){
		return { name: 'a country' };
	}

	beforeEach( () => {

		metadata = {
			getCountry,
			statusTypes: {
				'1': 'test',
				'2': 'testing',
				'3': 'more tests'
			}
		};

		viewModel = proxyquire( modulePath, {
			'../../../lib/metadata': metadata
		} );
	} );

	describe( 'When there are some reports', () => {

		let reports;

		beforeEach( () => {

			reports = [
				{
					problem_status: '1',
					is_emergency: true,
					is_resolved: true,
					export_country: 'a'
				},{
					problem_status: '2',
					is_emergency: true,
					is_resolved: true,
					export_country: 'b'
				},{
					problem_status: '3',
					is_emergency: false,
					is_resolved: false,
					export_country: 'c'
				},{
					problem_status: '3',
					is_emergency: false,
					is_resolved: false,
					export_country: 'd'
				}
			];
		} );

		it( 'Should transform them', () => {

			const output = viewModel( reports );

			expect( output.reports[ 3 ] ).toEqual( {
				export_country: reports[ 0 ].export_country,
				country: getCountry(),
				is_resolved: true,
				isResolved: true,
				is_emergency: true,
				problem_status: {
					id: '1',
					name: 'test',
					isEmergency: true
				}
			} );

			expect( output.reports[ 2 ] ).toEqual( {
				export_country: reports[ 1 ].export_country,
				country: getCountry(),
				is_resolved: true,
				isResolved: true,
				is_emergency: true,
				problem_status: {
					id: '2',
					name: 'testing',
					isEmergency: true
				}
			} );

			expect( output.reports[ 1 ] ).toEqual( {
				export_country: reports[ 2 ].export_country,
				country: getCountry(),
				is_resolved: false,
				isResolved: false,
				is_emergency: false,
				problem_status: {
					id: '3',
					name: 'more tests',
					isEmergency: false
				}
			} );

			expect( output.reports[ 0 ] ).toEqual( {
				export_country: reports[ 3 ].export_country,
				country: getCountry(),
				is_resolved: false,
				isResolved: false,
				is_emergency: false,
				problem_status: {
					id: '3',
					name: 'more tests',
					isEmergency: false
				}
			} );
		} );

		it( 'Should sort them', () => {

			reports[ 0 ].created_on = 'Tue, 28 Aug 2018 08:19:05 GMT';
			reports[ 1 ].created_on = 'Mon, 27 Aug 2018 08:10:00 GMT';
			reports[ 2 ].created_on = 'Tue, 28 Aug 2018 08:19:05 GMT';
			reports[ 3 ].created_on = 'Thur, 30 Aug 2018 08:19:05 GMT';

			const output = viewModel( reports );

			expect( output.reports[ 0 ].problem_status.id ).toEqual( '2' );
			expect( output.reports[ 1 ].problem_status.id ).toEqual( '1' );
			expect( output.reports[ 2 ].problem_status.id ).toEqual( '3' );
			expect( output.reports[ 3 ].problem_status.id ).toEqual( '3' );
		} );
	} );

	describe( 'When the list of reports is empty', () => {
		it( 'Should return the reports', () => {

			const country = { country: true };
			const input = [];
			const output = viewModel( input, country );

			expect( output ).toEqual( { reports: input, country } );
		} );
	} );
} );
