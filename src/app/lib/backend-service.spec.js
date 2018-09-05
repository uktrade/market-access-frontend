const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = './backend-service';

const getFakeData = jasmine.helpers.getFakeData;

describe( 'Backend Service', () => {

	let token;
	let backend;
	let service;
	let req;

	beforeEach( () => {

		token = uuid();
		req = { session: { ssoToken: token } };
		backend = {
			get: jasmine.createSpy( 'backend.get' ),
			post: jasmine.createSpy( 'backend.post' ),
			put: jasmine.createSpy( 'backend.put' )
		};

		service = proxyquire( modulePath, {
			'./backend-request': backend
		} );
	} );

	describe( 'getUser', () => {
		it( 'Should call the correct path', async () => {

			await service.getUser( req );

			expect( backend.get ).toHaveBeenCalledWith( '/whoami', token );
		} );
	} );

	describe( 'getMetadata', () => {
		it( 'Should call the correct path', async () => {

			await service.getMetadata();

			expect( backend.get ).toHaveBeenCalledWith( '/metadata' );
		} );
	} );

	describe( 'Barriers', () => {

		let barrierId;

		beforeEach( () => {

			barrierId = uuid();
		} );

		describe( 'getAll', () => {
			it( 'Should call the correct path', async () => {

				await service.barriers.getAll( req );

				expect( backend.get ).toHaveBeenCalledWith( '/barriers', token );
			} );
		} );

		describe( 'get', () => {
			it( 'Should call the correct path', async () => {

				await service.barriers.get( req, barrierId );

				expect( backend.get ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token );
			} );
		} );

		describe( 'getInteractions', () => {
			it( 'Should call the correct path', async () => {

				await service.barriers.getInteractions( req, barrierId );

				expect( backend.get ).toHaveBeenCalledWith( `/barriers/${ barrierId }/interactions`, token );
			} );
		} );

		describe( 'saveNote', () => {
			it( 'Should POST to the correct path with the correct values', async () => {

				const note = 'my test note';
				const pinned = 'true';

				await service.barriers.saveNote( req, barrierId, {
					note,
					pinned
				} );

				expect( backend.post ).toHaveBeenCalledWith( `/barriers/${ barrierId }/interactions`, token, {
					text: note,
					pinned: true
				} );
			} );
		} );

		describe( 'resolve', () => {
			it( 'Should POST to the correct path with the correct values', async () => {

				const [ day, month, year ] = [ '10', '11', '2000' ];
				const resolvedSummary = 'my summary text';

				await service.barriers.resolve( req, barrierId, {
					resolvedDate: { day, month, year },
					resolvedSummary
				} );

				expect( backend.post ).toHaveBeenCalledWith( `/barriers/${ barrierId }/resolve`, token, {
					status_date: [ year, month, day ].join( '-' ) + 'T00:00',
					summary: resolvedSummary
				} );
			} );
		} );

		describe( 'open', () => {
			it( 'Should POST to the correct path with the correct values', async () => {

				const openSummary = 'my summary text';

				await service.barriers.open( req, barrierId, {
					openSummary
				} );

				expect( backend.post ).toHaveBeenCalledWith( `/barriers/${ barrierId }/open`, token, {
					summary: openSummary
				} );
			} );
		} );

		describe( 'hibernate', () => {
			it( 'Should POST to the correct path with the correct values', async () => {

				const hibernationSummary = 'my summary text';

				await service.barriers.hibernate( req, barrierId, {
					hibernationSummary
				} );

				expect( backend.post ).toHaveBeenCalledWith( `/barriers/${ barrierId }/hibernate`, token, {
					summary: hibernationSummary
				} );
			} );
		} );
	} );

	xdescribe( 'Reports', () => {
		describe( 'getAll', () => {
			describe( 'When the results are an array', () => {
				it( 'Should call the correct path and sort the progress', async () => {

					backend.get.and.callFake( () => Promise.resolve( { response: { isSuccess: true }, body: getFakeData( '/backend/reports/' ) } ) );

					const { body } = await service.reports.getAll( req );

					expect( backend.get ).toHaveBeenCalledWith( '/reports', token );
					expect( body.results[ 0 ].progress.map( ( item ) => item.stage_code ) ).toEqual( [ '1.3', '1.4', '1.4', '1.5', '2.4', '2.5', '3', '3.1' ] );
				} );
			} );

			describe( 'When the results are NOT an array', () => {
				it( 'Should call the correct path and NOT sort the progress', async () => {

					const responseBody = {
						"count": 1,
						"results": 'test'
					};

					backend.get.and.callFake( () => Promise.resolve( { response: { isSuccess: true }, body: responseBody } ) );

					await service.reports.getAll( req );

					expect( backend.get ).toHaveBeenCalledWith( '/reports', token );
				} );
			} );
		} );

		describe( 'get', () => {
			describe( 'When the response is a success', () => {
				it( 'Should call the correct path and sort the progress', () => {

					const reportId = 1;
					const report = getFakeData( '/backend/reports/report' );

					backend.get.and.callFake( () => Promise.resolve( { response: { isSuccess: true }, body: report } ) );

					service.reports.get( req, reportId );

					expect( backend.get ).toHaveBeenCalledWith( `/reports/${ reportId }`, token );
				} );
			} );

			describe( 'When the response is not a success', () => {
				it( 'Should not sort the progress', () => {

					const reportId = 1;

					backend.get.and.callFake( () => Promise.resolve( { response: { isSuccess: false }, body: {} } ) );

					service.reports.get( req, reportId );

					expect( backend.get ).toHaveBeenCalledWith( `/reports/${ reportId }`, token );
				} );
			} );
		} );

		describe( 'save', () => {
			describe( 'When the values are empty', () => {
				it( 'Should POST to the correct path with null values', () => {

					const company = { id: '', name: '', sector: null };
					const contactId = '';

					service.reports.save( req, {
						status: '',
						emergency: '',
						company,
						contactId
					} );

					expect( backend.post ).toHaveBeenCalledWith( '/reports', token, {
						problem_status: null,
						is_emergency: null,
						company_id: null,
						company_name: null,
						company_sector_id: null,
						company_sector_name: null,
						contact_id: null
					} );
				} );
			} );

			describe( 'When the values are not empty', () => {

				let status;
				let emergency;
				let company;
				let contactId;

				beforeEach( () => {

					status = 1;
					emergency = 2;
					company = { id: 3, name: 'test company', sector: null };
					contactId = '123-abc';
				} );

				describe( 'When there is a sector for the company', () => {
					it( 'Should POST to the correct path with the values and the sector', () => {

						company.sector = { id: 4, name: 'a sector' };

						service.reports.save( req, {
							status,
							emergency,
							company,
							contactId
						} );

						expect( backend.post ).toHaveBeenCalledWith( '/reports', token, {
							problem_status: status,
							is_emergency: emergency,
							company_id: company.id,
							company_name: company.name,
							company_sector_id: company.sector.id,
							company_sector_name: company.sector.name,
							contact_id: contactId
						} );
					} );
				} );

				describe( 'When there is not a sector for the company', () => {
					it( 'Should POST to the correct path with the values and sector as null', () => {

						service.reports.save( req, {
							status,
							emergency,
							company,
							contactId
						} );

						expect( backend.post ).toHaveBeenCalledWith( '/reports', token, {
							problem_status: status,
							is_emergency: emergency,
							company_id: company.id,
							company_name: company.name,
							company_sector_id: null,
							company_sector_name: null,
							contact_id: contactId
						} );
					} );
				} );
			} );
		} );

		describe( 'PUTing data to the report', () => {

			let reportId;
			let path;

			beforeEach( () => {

				reportId = parseInt( Math.random() * 100, 10 );
				path = `/reports/${ reportId }`;
			} );

			function checkWithAndWithoutValues( methodName, serviceData, backendData ){

				describe( 'With empty values', () => {
					it( 'Should use null for the values', () => {

						const emptyServiceData = {};
						const nullBackendData = {};

						for( let key of Object.keys( serviceData ) ){
							emptyServiceData[ key ] = '';
						}

						for( let key of Object.keys( backendData ) ){

							nullBackendData[ key ] = null;
						}

						service.reports[ methodName ]( req, reportId, emptyServiceData );

						expect( backend.put ).toHaveBeenCalledWith( path, token, nullBackendData );
					} );
				} );

				describe( 'With non empty values', () => {
					it( 'Should use the values', () => {

					service.reports[ methodName ]( req, reportId, serviceData );

					expect( backend.put ).toHaveBeenCalledWith( path, token, backendData );
					} );
				} );
			}

			describe( 'update', () => {

				const status = 1;
				const emergency = 2;
				const company = { id: 3, name: 'test company', sector: { id: 4, name: 'another sector' } };
				const contactId = '123-abc';

				checkWithAndWithoutValues( 'update', {
					status,
					emergency,
					company,
					contactId
				}, {
					problem_status: status,
					is_emergency: emergency,
					company_id: company.id,
					company_name: company.name,
					company_sector_id: company.sector.id,
					company_sector_name: company.sector.name,
					contact_id: contactId
				} );
			} );

			describe( 'saveProblem', () => {

				const item = '1';
				const commodityCode = '1, 2';
				const country = 'a';
				const description = 'b';
				const barrierTitle = 'c';
				const barrierAwareness = 'd';
				const barrierAwarenessOther = 'e';

				checkWithAndWithoutValues( 'saveProblem', {
					item,
					commodityCode,
					country,
					description,
					barrierTitle,
					barrierAwareness,
					barrierAwarenessOther
				}, {
					product: item,
					commodity_codes: commodityCode,
					export_country: country,
					problem_description: description,
					barrier_title: barrierTitle,
					barrier_awareness: barrierAwareness,
					barrier_awareness_other: barrierAwarenessOther
				} );
			} );

			describe( 'saveImpact', () => {

				const impact = '1';
				const losses = '2';
				const otherCompanies = '3';
				const otherCompaniesInfo = 'test';

				checkWithAndWithoutValues( 'saveImpact', {
					impact,
					losses,
					otherCompanies,
					otherCompaniesInfo
				}, {
					problem_impact: impact,
					estimated_loss_range: losses,
					other_companies_affected: otherCompanies,
					other_companies_info: otherCompaniesInfo
				} );
			} );

			describe( 'saveLegal', () => {

				const hasInfringed = 'true';
				const infringements = {
					wtoInfringement: 'true',
					ftaInfringement: '',
					otherInfringement: 'true'
				};
				const infringementSummary = 'test';

				checkWithAndWithoutValues( 'saveLegal', {
					hasInfringed,
					infringements,
					infringementSummary
				}, {
					has_legal_infringement: hasInfringed,
					wto_infringement: true,
					fta_infringement: false,
					other_infringement: true,
					infringement_summary: infringementSummary
				} );
			} );

			describe( 'saveBarrierType', () => {

				const barrierType = '2';

				checkWithAndWithoutValues( 'saveBarrierType', { barrierType }, { barrier_type: barrierType } );
			} );

			describe( 'saveSupport', () => {

				const resolved = '1';
				const supportType = '2';
				const stepsTaken = '3';
				const politicalSensitivities = '1';
				const sensitivitiesDescription = 'test';
				const resolvedDate = { year: '2016', month: '01', day: '01' };
				const resolvedSummary = 'resolvedSummary';

				checkWithAndWithoutValues( 'saveSupport', {
					resolved,
					supportType,
					stepsTaken,
					resolvedDate,
					resolvedSummary,
					politicalSensitivities,
					sensitivitiesDescription
				}, {
					is_resolved: resolved,
					support_type: supportType,
					steps_taken: stepsTaken,
					resolved_date: '2016-01-01',
					resolution_summary: resolvedSummary,
					is_politically_sensitive: politicalSensitivities,
					political_sensitivity_summary: sensitivitiesDescription
				} );
			} );

			describe( 'saveNextSteps', () => {

				const response = '1';
				const sensitivities = '2';
				const sensitivitiesText = '3';
				const permission = '4';

				checkWithAndWithoutValues( 'saveNextSteps', {
					response,
					sensitivities,
					sensitivitiesText,
					permission
				}, {
					govt_response_requested: response,
					is_commercially_sensitive: sensitivities,
					commercial_sensitivity_summary: sensitivitiesText,
					can_publish: permission
				} );
			} );
		} );

		describe( 'submit', () => {
			it( 'Should call the correct path', () => {

				const reportId = 200;

				service.reports.submit( req, reportId );

				expect( backend.put ).toHaveBeenCalledWith( `/reports/${ reportId }/submit`, token );
			} );
		} );
	} );
} );
