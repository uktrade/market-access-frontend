const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = './detail';

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

const statusTypes = {
	'1': 'One',
	'2': 'Two'
};

describe( 'Report detail view model', () => {

	let viewModel;
	let urls;
	let csrfToken;
	let getCountry;
	let country;

	beforeEach( () => {

		csrfToken = uuid();
		country = { name: 'a country', id: '1' };
		getCountry = jasmine.createSpy( 'metadata.getCountry' ).and.callFake( () => country );

		urls = {
			reportStage: jasmine.createSpy( 'urls.reportStage' )
		};

		viewModel = proxyquire( modulePath, {
			'../../../lib/urls': urls,
			'../../../lib/metadata': { reportTaskList, statusTypes, getCountry }
		} );
	} );

	describe( 'With a report', () => {
		describe( 'Without inProgress', () => {

			let report;
			let expectedOutput;

			beforeEach( () => {

				report = {
					id: 1,
					export_country: 'abc',
					problem_status: '2',
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

				expectedOutput = [
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
				];

				expectedOutput.complete = false;
				expectedOutput.next = expectedOutput[ 1 ].items[ 0 ];
			} );

			describe( 'When the company is matched', () => {
				it( 'Should return the correct data', () => {

					const output = viewModel( csrfToken, report );

					expect( output.csrfToken ).toEqual( csrfToken );
					expect( output.tasks ).toEqual( expectedOutput );
					expect( output.calloutText ).toEqual( `${ statusTypes[ '2' ] } in ${ country.name }` );
				} );
			} );

			describe( 'When the company is NOT matched', () => {
				it( 'Should return the correct data', () => {

					getCountry.and.callFake( () => {} );

					const output = viewModel( csrfToken, report );

					expect( output.csrfToken ).toEqual( csrfToken );
					expect( output.tasks ).toEqual( expectedOutput );
					expect( output.calloutText ).toEqual( `${ statusTypes[ '2' ] }` );
				} );
			} );
		} );

		describe( 'With inProgress', () => {
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
							"status_id": 2
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

				const output = viewModel( csrfToken, report );

				const expectedOutput = [
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
								inProgress: true,
								complete: false,
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
								complete: false
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
				];

				expectedOutput.complete = false;
				expectedOutput.next = expectedOutput[ 0 ].items[ 4 ];

				expect( output.csrfToken ).toEqual( csrfToken );
				expect( output.tasks ).toEqual( expectedOutput );
			} );
		} );

		describe( 'Without a progress property', () => {
			it( 'Should return the correct data', () => {

				const report = {
					id: 2
				};

				const reportStageResponse = '/a/b/c/';

				urls.reportStage.and.callFake( () => reportStageResponse );

				const output = viewModel( csrfToken, report );

				const expectedOutput = [
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
								complete: false
							},{
								stage: '1.2',
								name: 'quos sequi commodi',
								notStarted: false,
								inProgress: false,
								complete: false
							},{
								stage: '1.3',
								name: 'qui aliquid natus',
								notStarted: false,
								inProgress: false,
								complete: false
							},{
								stage: '1.4',
								name: 'aliquam nisi quibusdam',
								notStarted: false,
								inProgress: false,
								complete: false
							},{
								stage: '1.5',
								name: 'molestiae minus voluptatem',
								notStarted: false,
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
								stage: '2.0',
								name: 'sed fuga exercitationem',
								notStarted: false,
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
								stage: '3.0',
								name: 'non minus necessitatibus',
								notStarted: false,
								inProgress: false,
								complete: false
							}
						]
					}
				];

				expectedOutput.complete = false;
				expectedOutput.next = undefined;

				expect( output.csrfToken ).toEqual( csrfToken );
				expect( output.tasks ).toEqual( expectedOutput );
			} );
		} );

		describe( 'When all tasks are complete', () => {
			it( 'Should return the correct data', () => {

				const report = {
					id: 2,
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
							"status_id": 3
						},{
							"stage_code": "3.0",
							"status_id": 3
						}
					]
				};

				const reportStageResponse = '/a/b/c/';

				urls.reportStage.and.callFake( () => reportStageResponse );

				const output = viewModel( csrfToken, report );

				const expectedOutput = [
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
								notStarted: false,
								inProgress: false,
								complete: true,
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
								notStarted: false,
								inProgress: false,
								complete: true,
								href: reportStageResponse
							}
						]
					}
				];

				expectedOutput.complete = true;
				expectedOutput.next = undefined;

				expect( output.csrfToken ).toEqual( csrfToken );
				expect( output.tasks ).toEqual( expectedOutput );
			} );
		} );
	} );
} );
