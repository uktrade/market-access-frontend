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
			it( 'Should PUT to the correct path with the correct values', async () => {

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
			it( 'Should PUT to the correct path with the correct values', async () => {

				const [ day, month, year ] = [ '10', '11', '2000' ];
				const resolvedSummary = 'my summary text';

				await service.barriers.resolve( req, barrierId, {
					resolvedDate: { day, month, year },
					resolvedSummary
				} );

				expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }/resolve`, token, {
					status_date: [ year, month, day ].join( '-' ) + 'T00:00',
					summary: resolvedSummary
				} );
			} );
		} );

		describe( 'open', () => {
			it( 'Should PUT to the correct path with the correct values', async () => {

				const openSummary = 'my summary text';

				await service.barriers.open( req, barrierId, {
					openSummary
				} );

				expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }/open`, token, {
					summary: openSummary
				} );
			} );
		} );

		describe( 'hibernate', () => {
			it( 'Should PUT to the correct path with the correct values', async () => {

				const hibernationSummary = 'my summary text';

				await service.barriers.hibernate( req, barrierId, {
					hibernationSummary
				} );

				expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }/hibernate`, token, {
					summary: hibernationSummary
				} );
			} );
		} );
	} );

	describe( 'Reports', () => {
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

					service.reports.save( req, {
						status: '',
						isResolved: '',
						resolvedDate: '',
						country: ''
					} );

					expect( backend.post ).toHaveBeenCalledWith( '/reports', token, {
						problem_status: null,
						is_resolved: null,
						resolved_date: null,
						export_country: null
					} );
				} );
			} );

			describe( 'When the values are not empty', () => {

				let status;
				let isResolved;
				let resolvedDate;
				let country;

				beforeEach( () => {

					status = 1;
					isResolved = true;
					resolvedDate = { year: '2018', month:'02' };
					country = uuid();
				} );

				it( 'Should POST to the correct path with the values and sector as null', () => {

					service.reports.save( req, {
						status,
						isResolved,
						resolvedDate,
						country
					} );

					expect( backend.post ).toHaveBeenCalledWith( '/reports', token, {
						problem_status: status,
						is_resolved: isResolved,
						resolved_date: '2018-02-01',
						export_country: country
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
				const isResolved = true;
				const resolvedDate = { year: '2018', month:'02' };
				const country = uuid();

				describe( 'When the resolvedDate has a year and month', () => {

					checkWithAndWithoutValues( 'update', {
						status,
						isResolved,
						resolvedDate,
						country
					}, {
						problem_status: status,
						is_resolved: isResolved,
						resolved_date: '2018-02-01',
						export_country: country
					} );
				} );

				describe( 'When the resolvedDate is an empty object', () => {

					checkWithAndWithoutValues( 'update', {
						status,
						isResolved,
						resolvedDate: {},
						country
					}, {
						problem_status: status,
						is_resolved: isResolved,
						resolved_date: null,
						export_country: country
					} );
				} );
			} );

			describe( 'saveHasSectors', () => {

				const hasSectors = 'true';

				checkWithAndWithoutValues( 'saveHasSectors', {
					hasSectors
				}, {
					sectors_affected: hasSectors
				} );
			} );

			describe( 'saveSectors', () => {

				const sectors = [
					uuid(),
					uuid()
				];

				checkWithAndWithoutValues( 'saveSectors', {
					sectors
				}, {
					sectors
				} );
			} );

			describe( 'saveProblem', () => {

				const item = '1';
				const description = 'b';
				const barrierTitle = 'c';
				const barrierAwareness = 'd';
				const barrierAwarenessOther = 'e';

				checkWithAndWithoutValues( 'saveProblem', {
					item,
					description,
					barrierTitle,
					barrierAwareness,
					barrierAwarenessOther
				}, {
					product: item,
					problem_description: description,
					barrier_title: barrierTitle,
					source: barrierAwareness,
					other_source: barrierAwarenessOther
				} );
			} );

			describe( 'saveBarrierType', () => {

				const barrierType = '2';

				checkWithAndWithoutValues( 'saveBarrierType', { barrierType }, { barrier_type: barrierType } );
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
