const proxyquire = require( 'proxyquire' );
const modulePath = '../../../../../../app/lib/view-models/report/detail';

describe( 'Report detail view model', () => {

	let viewModel;
	let urls;

	beforeEach( () => {

		urls = {
			reportStage: jasmine.createSpy( 'urls.reportStage' )
		};

		viewModel = proxyquire( modulePath, {
			'../../urls': urls,
			'../../metadata': {
				reportStages: {
					"1.0": "Report a problem",
					"1.1": "Status of the problem",
					"1.2": "Export company affected",
					"1.3": "About the reporter",
					"1.4": "About the problem",
					"1.5": "Next steps the company affected have requested",
					"2.0": "Create a barrier record",
					"3.0": "Tell us what happens next"
				}
			}
		} );
	} );

	describe( 'With a report', () => {
		it( 'Should return the correct data', () => {

			const report = {
				id: 1,
				progress: [
					{
						"stage_code": "1.1",
						"stage_desc": "Status of the problem",
						"status_id": 3,
						"status_desc": "COMPLETED"
					},{
						"stage_code": "1.2",
						"stage_desc": "Export company affected",
						"status_id": 3,
						"status_desc": "COMPLETED"
					},{
						"stage_code": "1.3",
						"stage_desc": "About the reporter",
						"status_id": 3,
						"status_desc": "COMPLETED"
					}
				]
			};

			const reportStageResponse = '/a/b/c/';

			urls.reportStage.and.callFake( () => reportStageResponse );

			const output = viewModel( report );

			expect( output.tasks ).toEqual( [
				{
					stage: '1.0',
					name: 'Report a problem',
					number: true,
					items: [
						{
							stage: '1.1',
							name: 'Status of the problem',
							inProgress: false,
							complete: true,
							href: reportStageResponse
						},{
							stage: '1.2',
							name: 'Export company affected',
							inProgress: false,
							complete: true,
							href: reportStageResponse
						},{
							stage: '1.3',
							name: 'About the reporter',
							inProgress: false,
							complete: true,
							href: reportStageResponse
						},{
							stage: '1.4',
							name: 'About the problem',
							inProgress: false,
							complete: false,
							notStarted: true,
							href: reportStageResponse
						},{
							stage: '1.5',
							name: 'Next steps the company affected have requested',
							inProgress: false,
							complete: false
						}
					]
				},{
					stage: '2.0',
					name: 'Create a barrier record',
					number: false,
					items: [
						{
							name: 'Name and summarise the barrier'
						}
					]
				},{
					stage: '3.0',
					name: 'Tell us what happens next',
					number: false,
					items: [
						{
							name: 'Describe next steps and what type of support you might need'
						}
					]
				}
			] );
		} );
	} );
} );
