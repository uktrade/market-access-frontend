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
					id: 1,
					problem_status: '1',
					is_resolved: true,
					export_country: 'a'
				},{
					id: 2,
					problem_status: '2',
					is_resolved: true,
					export_country: 'b'
				},{
					id: 3,
					problem_status: '3',
					is_resolved: false,
					export_country: 'c'
				},{
					id: 4,
					problem_status: '3',
					is_resolved: false,
					export_country: 'd'
				}
			];
		} );

		function getReports(){
			return JSON.parse( JSON.stringify( reports ) );
		}

		function getReport( id ){

			return reports.find( ( report ) => report.id == id );
		}

		it( 'Should transform them', () => {

			const output = viewModel( getReports() );

			function getOutputReport( id ){

				return output.reports.find( ( report ) => report.id == id );
			}

			function createExpectation( id ){

				const report = getReport( id );

				return {
					id,
					export_country: report.export_country,
					country: getCountry(),
					is_resolved: report.is_resolved,
					isResolved: report.is_resolved,
					problem_status: {
						id: report.problem_status,
						name: metadata.statusTypes[ report.problem_status ]
					},
					date: {
						created: report.created_on
					}
				};
			}

			for ( let i = 1; i <= 4; i++ ){

				expect( getOutputReport( i ) ).toEqual( createExpectation( i ) );
			}
		} );

		it( 'Should not sort them', () => {

			reports[ 3 ].created_on = 'Thur, 30 Aug 2018 08:19:05 GMT';
			reports[ 0 ].created_on = 'Tue, 28 Aug 2018 08:19:05 GMT';
			reports[ 2 ].created_on = 'Tue, 28 Aug 2018 08:19:05 GMT';
			reports[ 1 ].created_on = 'Mon, 27 Aug 2018 08:10:00 GMT';

			const output = viewModel( getReports() );

			expect( output.reports[ 0 ].id ).toEqual( 1 );
			expect( output.reports[ 1 ].id ).toEqual( 2 );
			expect( output.reports[ 2 ].id ).toEqual( 3 );
			expect( output.reports[ 3 ].id ).toEqual( 4 );
		} );

		describe( 'When there is a current report', () => {
			it( 'Sets the current report', () => {

				const currentReportId = 1;

				const output = viewModel( getReports(), currentReportId );

				expect( output.currentReport).toBeDefined();
				expect( output.currentReport.id).toEqual(1);
			});
		});
	} );

	describe( 'When the list of reports is empty', () => {
		it( 'Should return the reports', () => {

			const input = [];
			const output = viewModel( input, undefined );

			expect( output ).toEqual( { reports: input, currentReport: undefined } );
		} );
	} );
} );
