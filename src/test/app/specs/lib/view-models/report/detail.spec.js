const proxyquire = require( 'proxyquire' );
const modulePath = '../../../../../../app/lib/view-models/report/detail';

const reportTaskList = [
	{
		"stage": "1.0",
		"name": "labore ea voluptatem",
		"items": [
			{
				"stage": "1.1",
				"name": "unde culpa quia"
			},
			{
				"stage": "1.2",
				"name": "quos sequi commodi"
			},
			{
				"stage": "1.3",
				"name": "qui aliquid natus"
			},
			{
				"stage": "1.4",
				"name": "aliquam nisi quibusdam"
			},
			{
				"stage": "1.5",
				"name": "molestiae minus voluptatem"
			}
		],
		"number": true
	},{
		"stage": "2.0",
		"name": "nam cumque fuga",
		"items": [
			{
				"name": "sed fuga exercitationem",
				"stage": "2.0"
			}
		],
		"number": false
	},{
		"stage": "3.0",
		"name": "sunt quo sit",
		"items": [
			{
				"name": "non minus necessitatibus",
				"stage": "3.0"
			}
		],
		"number": false
	}
];

describe( 'Report detail view model', () => {

	let viewModel;
	let urls;

	beforeEach( () => {

		urls = {
			reportStage: jasmine.createSpy( 'urls.reportStage' )
		};

		viewModel = proxyquire( modulePath, {
			'../../urls': urls,
			'../../metadata': { reportTaskList }
		} );
	} );

	describe( 'With a report', () => {
		it( 'Should return the correct data', () => {

			const report = {
				id: 1,
				progress: [
					{
						"stage_code": "1.1",
						"status_id": 3
					},{
						"stage_code": "1.2",
						"status_id": 3
					},{
						"stage_code": "1.3",
						"status_id": 3
					},{
						"stage_code": "1.4",
						"status_id": 3
					},{
						"stage_code": "1.5",
						"status_id": 3
					},{
						"stage_code": "2.0",
						"status_id": 1
					},{
						"stage_code": "3.0",
						"status_id": 1
					}
				]
			};

			const reportStageResponse = '/a/b/c/';

			urls.reportStage.and.callFake( () => reportStageResponse );

			const output = viewModel( report );

			expect( output.tasks ).toEqual( [
				{
					stage: '1.0',
					name: 'labore ea voluptatem',
					number: true,
					items: [
						{
							stage: '1.1',
							name: 'unde culpa quia',
							notStarted: false,
							inProgress: false,
							complete: true,
							href: reportStageResponse
						},{
							stage: '1.2',
							name: 'quos sequi commodi',
							notStarted: false,
							inProgress: false,
							complete: true,
							href: reportStageResponse
						},{
							stage: '1.3',
							name: 'qui aliquid natus',
							notStarted: false,
							inProgress: false,
							complete: true,
							href: reportStageResponse
						},{
							stage: '1.4',
							name: 'aliquam nisi quibusdam',
							notStarted: false,
							inProgress: false,
							complete: true,
							href: reportStageResponse
						},{
							stage: '1.5',
							name: 'molestiae minus voluptatem',
							notStarted: false,
							inProgress: false,
							complete: true,
							href: reportStageResponse
						}
					]
				},{
					stage: '2.0',
					name: 'nam cumque fuga',
					number: false,
					items: [
						{
							stage: '2.0',
							name: 'sed fuga exercitationem',
							notStarted: true,
							inProgress: false,
							complete: false,
							href: reportStageResponse
						}
					]
				},{
					stage: '3.0',
					name: 'sunt quo sit',
					number: false,
					items: [
						{
							stage: '3.0',
							name: 'non minus necessitatibus',
							notStarted: true,
							inProgress: false,
							complete: false
						}
					]
				}
			] );
		} );
	} );
} );
