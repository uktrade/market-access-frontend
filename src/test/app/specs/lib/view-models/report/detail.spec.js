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
				"name": "sed fuga exercitationem"
			}
		],
		"number": false
	},{
		"stage": "3.0",
		"name": "sunt quo sit",
		"items": [
			{
				"name": "non minus necessitatibus"
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
							inProgress: false,
							complete: true,
							href: reportStageResponse
						},{
							stage: '1.2',
							name: 'quos sequi commodi',
							inProgress: false,
							complete: true,
							href: reportStageResponse
						},{
							stage: '1.3',
							name: 'qui aliquid natus',
							inProgress: false,
							complete: true,
							href: reportStageResponse
						},{
							stage: '1.4',
							name: 'aliquam nisi quibusdam',
							inProgress: false,
							complete: false,
							notStarted: true,
							href: reportStageResponse
						},{
							stage: '1.5',
							name: 'molestiae minus voluptatem',
							inProgress: false,
							complete: false
						}
					]
				},{
					stage: '2.0',
					name: 'nam cumque fuga',
					number: false,
					items: [
						{
							name: 'sed fuga exercitationem',
							inProgress: false,
							complete: false
						}
					]
				},{
					stage: '3.0',
					name: 'sunt quo sit',
					number: false,
					items: [
						{
							name: 'non minus necessitatibus',
							inProgress: false,
							complete: false
						}
					]
				}
			] );
		} );
	} );
} );
