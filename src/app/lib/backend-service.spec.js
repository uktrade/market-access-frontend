const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const faker = require( 'faker' );
const modulePath = './backend-service';

const getFakeData = jasmine.helpers.getFakeData;

describe( 'Backend Service', () => {

	let token;
	let backend;
	let service;
	let req;
	let metadata;

	beforeEach( () => {

		token = uuid();
		req = { session: { ssoToken: token } };
		backend = {
			get: jasmine.createSpy( 'backend.get' ),
			post: jasmine.createSpy( 'backend.post' ),
			put: jasmine.createSpy( 'backend.put' ),
			delete: jasmine.createSpy( 'backend.delete' ),
		};
		metadata = {
			getCountry: jasmine.createSpy( 'metadata.country' )
		};

		service = proxyquire( modulePath, {
			'./backend-request': backend,
			'./metadata': metadata,
			'../config': {
				files: {
					scan: {
						statusCheckInterval: 10, //make the test run faster
						maxWaitTime: 2000,
					}
				}
			}
		} );
	} );

	describe( 'getUser', () => {
		describe( 'When the response is a success', () => {
			it( 'Should call the correct path and transform the response', async () => {

				const body = { location: 'test' };
				const countryResponse = 'a country';

				backend.get.and.callFake( () => Promise.resolve( { response: { isSuccess: true }, body }) );
				metadata.getCountry.and.callFake( () => countryResponse );

				await service.getUser( req );

				expect( backend.get ).toHaveBeenCalledWith( '/whoami', token );
				expect( body.country ).toEqual( countryResponse );
			} );
		} );

		describe( 'When the response is not a success', () => {
			it( 'Should call the correct path and not transform the response', async () => {

				const body = { location: 'test' };

				backend.get.and.callFake( () => Promise.resolve( { response: { isSuccess: false }, body }) );

				await service.getUser( req );

				expect( backend.get ).toHaveBeenCalledWith( '/whoami', token );
				expect( body.country ).toEqual( {} );
			} );
		} );
	} );

	describe( 'ping', () => {
		it( 'Should call the correct path', async () => {

			backend.get.and.callFake( () => Promise.resolve() );

			await service.ping();

			expect( backend.get ).toHaveBeenCalledWith( '/ping.xml' );
		} );
	} );

	describe( 'getCounts', () => {
		it( 'Should call the correct path', async () => {

			await service.getCounts( req );

			expect( backend.get ).toHaveBeenCalledWith( '/counts', token );
		} );
	} );

	describe( 'Documents', () => {
		describe( 'create', () => {
			it( 'Should call the correct API', async () => {

				const fileName = 'abc.csv';
				const size = 1234;

				await service.documents.create( req, fileName, size );

				expect( backend.post ).toHaveBeenCalledWith( '/documents', token, {
					original_filename: fileName,
					size
				} );
			} );
		} );

		describe( 'delete', () => {
			it( 'Should call the correct API', async () => {

				const documentId = uuid();

				await service.documents.delete( req, documentId );

				expect( backend.delete ).toHaveBeenCalledWith( `/documents/${ documentId }`, token );
			} );
		} );

		describe( 'uploadComplete', () => {
			it( 'Should call the correct API', async () => {

				const documentId = uuid();

				await service.documents.uploadComplete( req, documentId );

				expect( backend.post ).toHaveBeenCalledWith( `/documents/${ documentId }/upload-callback`, token );
			} );
		} );

		describe( 'download', () => {
			it( 'Should call the correct API', async () => {

				const documentId = uuid();

				await service.documents.download( req, documentId );

				expect( backend.get ).toHaveBeenCalledWith( `/documents/${ documentId }/download`, token );
			} );
		} );

		describe( 'getScanStatus', () => {
			describe( 'When the API returns success', () => {
				it( 'Should call the correct API and resolve', async () => {

					const documentId = uuid();

					backend.post.and.callFake( () => Promise.resolve( {
						response: { isSuccess: true },
						body: { status: 'virus_scanned' },
					} ) );

					const { status, passed } = await service.documents.getScanStatus( req, documentId );

					expect( backend.post ).toHaveBeenCalledWith( `/documents/${ documentId }/upload-callback`, token );
					expect( status ).toEqual( 'virus_scanned' );
					expect( passed ).toEqual( true );
				} );
			} );

			describe( 'When the API returns a 500', () => {
				it( 'Should call the correct API and reject', async () => {

					const documentId = uuid();

					backend.post.and.callFake( () => Promise.resolve( {
						response: { isSuccess: false, statusCode: 500 },
						body: {},
					} ) );

					try {

						await service.documents.getScanStatus( req, documentId );
						fail();

					} catch( e ){

						expect( backend.post ).toHaveBeenCalledWith( `/documents/${ documentId }/upload-callback`, token );
						expect( e ).toEqual( new Error( 'Not a successful response from the backend, got 500' ) );
					}
				} );
			} );

			describe( 'When the API rejects', () => {
				it( 'Should call the correct API and reject', async () => {

					const documentId = uuid();
					const err = new Error( 'Not a successful response' );

					backend.post.and.callFake( () => Promise.reject( err ) );

					try {

						await service.documents.getScanStatus( req, documentId );
						fail();

					} catch( e ){

						expect( backend.post ).toHaveBeenCalledWith( `/documents/${ documentId }/upload-callback`, token );
						expect( e ).toEqual( err );
					}
				} );
			} );
		} );
	} );

	describe( 'Barriers', () => {

		let barrierId;

		beforeEach( () => {

			barrierId = uuid();
		} );

		describe( 'getAll', () => {
			describe( 'With no filters', () => {
				it( 'Should call the correct path with default sort order', async () => {

					await service.barriers.getAll( req );

					expect( backend.get ).toHaveBeenCalledWith( '/barriers?ordering=-reported_on', token );
				} );
			} );

			describe( 'With a country filter', () => {
				it( 'Should call the correct path with default sort order', async () => {

					const country = uuid();

					await service.barriers.getAll( req, { country } );

					expect( backend.get ).toHaveBeenCalledWith( `/barriers?location=${ country }&ordering=-reported_on`, token );
				} );
			} );

			describe( 'With an overseas region filter', () => {
				it( 'Should call the correct path with default sort order', async () => {

					const region = uuid();

					await service.barriers.getAll( req, { region } );

					expect( backend.get ).toHaveBeenCalledWith( `/barriers?location=${ region }&ordering=-reported_on`, token );
				} );
			} );

			describe( 'With a country and an overseas region filter', () => {
				it( 'Should call the correct path with default sort order', async () => {

					const country = uuid();
					const region = uuid();

					await service.barriers.getAll( req, { region, country } );

					expect( backend.get ).toHaveBeenCalledWith( `/barriers?location=${ country },${ region }&ordering=-reported_on`, token );
				} );
			} );

			describe( 'With a sector filter', () => {
				it( 'Should call the correct path with default sort order', async () => {

					const sector = uuid();

					await service.barriers.getAll( req, { sector } );

					expect( backend.get ).toHaveBeenCalledWith( `/barriers?sector=${ sector }&ordering=-reported_on`, token );
				} );
			} );

			describe( 'With a type filter', () => {
				it( 'Should call the correct path with default sort order', async () => {

					const type = faker.lorem.word().toUpperCase();

					await service.barriers.getAll( req, { type } );

					expect( backend.get ).toHaveBeenCalledWith( `/barriers?barrier_type=${ type }&ordering=-reported_on`, token );
				} );
			} );

			describe( 'With a status filter', () => {
				it( 'Should call the correct path with default sort order', async () => {

					const status = '2,5';

					await service.barriers.getAll( req, { status } );

					expect( backend.get ).toHaveBeenCalledWith( `/barriers?status=${ status }&ordering=-reported_on`, token );
				} );
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

		describe( 'getHistory', () => {
			it( 'Should call the correct path', async () => {

				await service.barriers.getHistory( req, barrierId );

				expect( backend.get ).toHaveBeenCalledWith( `/barriers/${ barrierId }/history`, token );
			} );
		} );

		describe( 'notes', () => {
			describe( 'save', () => {
				describe( 'Without a documentId', () => {
					it( 'Should POST to the correct path with the correct values', async () => {

						const note = 'my test note';

						await service.barriers.notes.save( req, barrierId, {
							note,
						} );

						expect( backend.post ).toHaveBeenCalledWith( `/barriers/${ barrierId }/interactions`, token, {
							text: note,
							documents: null,
						} );
					} );
				} );

				describe( 'With a documentId', () => {
					it( 'Should POST to the correct path with the correct values', async () => {

						const note = 'my test note';
						const documentIds = [ uuid(), uuid() ];

						await service.barriers.notes.save( req, barrierId, {
							note,
							documentIds,
						} );

						expect( backend.post ).toHaveBeenCalledWith( `/barriers/${ barrierId }/interactions`, token, {
							text: note,
							documents: documentIds
						} );
					} );
				} );
			} );

			describe( 'update', () => {
				it( 'Should PUT to the correct path with the correct values', async () => {

					const noteId = '123';
					const note = 'my test note';
					const documentIds = [ uuid(), uuid() ];

					await service.barriers.notes.update( req, noteId, {
						note,
						documentIds,
					} );

					expect( backend.put ).toHaveBeenCalledWith( `/barriers/interactions/${ noteId }`, token, {
						text: note,
						documents: documentIds
					} );
				} );
			} );

			describe( 'delete', () => {
				it( 'Should DELETE to the correct path with the correct values', async () => {

					const noteId = '123';

					await service.barriers.notes.delete( req, noteId );

					expect( backend.delete ).toHaveBeenCalledWith( `/barriers/interactions/${ noteId }`, token );
				} );
			} );
		} );

		describe( 'resolve', () => {
			it( 'Should PUT to the correct path with the correct values', async () => {

				const [ month, year ] = [ '11', '2000' ];
				const resolvedSummary = 'my summary text';

				await service.barriers.resolve( req, barrierId, {
					resolvedDate: { month, year },
					resolvedSummary
				} );

				expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }/resolve`, token, {
					status_date: [ year, month, '01' ].join( '-' ),
					status_summary: resolvedSummary
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
					status_summary: hibernationSummary
				} );
			} );
		} );

		describe( 'open', () => {
			it( 'Should PUT to the correct path with the correct values', async () => {

				const reopenSummary = 'my summary text';

				await service.barriers.open( req, barrierId, {
					reopenSummary
				} );

				expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }/open`, token, {
					status_summary: reopenSummary
				} );
			} );
		} );

		describe( 'saveTypes', () => {
			it( 'Should PUT to the correct path with the correct values', async () => {

				const types = [ 'a', 'b' ];

				await service.barriers.saveTypes( req, barrierId, types );

				expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
					barrier_types: types,
				} );
			} );
		} );

		describe( 'saveSectors', () => {
			describe( 'With no sectors', () => {
				it( 'Should PUT to the correct path with a null value', async () => {

					const sectors = [];

					await service.barriers.saveSectors( req, barrierId, sectors );

					expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
						sectors: null
					} );
				} );
			} );

			describe( 'With a list of sectors', () => {
				it( 'Should PUT to the correct path with the correct values', async () => {

					const sectors = [ 'sector 1', 'sector 2' ];

					await service.barriers.saveSectors( req, barrierId, sectors );

					expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
						sectors
					} );
				} );
			} );
		} );

		describe( 'saveLocation', () => {

			let location;
			let country;

			beforeEach( () => {

				country = uuid();
				location = { country };
			} );

			describe( 'With no adminAreas', () => {
				it( 'Should PUT to the correct path with a empty array', async () => {

					await service.barriers.saveLocation( req, barrierId, location );

					expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
						export_country: country,
						country_admin_areas: []
					} );
				} );
			} );

			describe( 'With a list of adminAreas', () => {
				describe( 'When the list is empty', () => {
					it( 'Should PUT to the correct path with the correct values', async () => {

						location.adminAreas = [];

						await service.barriers.saveLocation( req, barrierId, location );

						expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
							export_country: country,
							country_admin_areas: []
						} );
					} );
				} );

				describe( 'When the list has some adminAreas', () => {
					it( 'Should PUT to the correct path with the adminAreas', async () => {

						const adminAreas = [ uuid(), uuid() ];

						location.adminAreas = adminAreas;

						await service.barriers.saveLocation( req, barrierId, location );

						expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
							export_country: country,
							country_admin_areas: adminAreas
						} );
					} );
				} );
			} );
		} );

		describe( 'saveCompanies', () => {
			describe( 'With no companies', () => {
				it( 'Should PUT to the correct path with a null value', async () => {

					const companies = [];

					await service.barriers.saveCompanies( req, barrierId, companies );

					expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
						companies: null
					} );
				} );
			} );

			describe( 'With a list of companies', () => {
				it( 'Should PUT to the correct path with the correct values', async () => {

					const companies = [ 'sector 1', 'sector 2' ];

					await service.barriers.saveCompanies( req, barrierId, companies );

					expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
						companies
					} );
				} );
			} );
		} );

		describe( 'saveStatus', () => {
			describe( 'With a status date', () => {
				it( 'Should PUT to the correct path with the correct values', async () => {

					const [ month, year ] = [ '11', '2000' ];
					const statusSummary = 'my summary text';

					await service.barriers.saveStatus( req, barrierId, {
						statusDate: { month, year },
						statusSummary
					} );

					expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
						status_date: [ year, month, '01' ].join( '-' ),
						status_summary: statusSummary
					} );
				} );
			});
			describe( 'Without a status date', () => {
				it( 'Should PUT to the correct path with the correct values', async () => {

					const statusSummary = 'my summary text';

					await service.barriers.saveStatus( req, barrierId, {
						statusSummary
					} );

					expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
						status_summary: statusSummary
					} );
				} );
			});
		} );

		describe( 'saveTitle', () => {
			it( 'Should PUT to the correct path with the correct values', async () => {

				const title = 'my title';

				await service.barriers.saveTitle( req, barrierId, {
					title,
				} );

				expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
					barrier_title: title,
				} );
			} );
		} );

		describe( 'saveProduct', () => {
			it( 'Should PUT to the correct path with the correct values', async () => {

				const product = 'my title';

				await service.barriers.saveProduct( req, barrierId, {
					product,
				} );

				expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
					product,
				} );
			} );
		} );

		describe( 'saveDescription', () => {
			it( 'Should PUT to the correct path with the correct values', async () => {

				const description = 'my long description';

				await service.barriers.saveDescription( req, barrierId, {
					description,
				} );

				expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
					problem_description: description,
				} );
			} );
		} );

		describe( 'saveSource', () => {
			describe( 'When source and other have a value', () => {
				it( 'Should PUT to the correct path with the correct values', async () => {

					const source = '1';
					const sourceOther = 'my source description';

					await service.barriers.saveSource( req, barrierId, {
						source,
						sourceOther,
					} );

					expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
						source: source,
						other_source: sourceOther
					} );
				} );
			} );

			describe( 'When only source has a value', () => {
				it( 'Should PUT to the correct path with the correct values', async () => {

					const source = '1';

					await service.barriers.saveSource( req, barrierId, {
						source,
						sourceOther: ''
					} );

					expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
						source: source,
						other_source: null
					} );
				} );
			} );
		} );

		describe( 'savePriority', () => {
			describe( 'When priority and other have a value', () => {
				it( 'Should PUT to the correct path with the correct values', async () => {

					const priority = '1';
					const priorityDescription = 'my priority description';

					await service.barriers.savePriority( req, barrierId, {
						priority,
						priorityDescription,
					} );

					expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
						priority: priority,
						priority_summary: priorityDescription
					} );
				} );
			} );

			describe( 'When only priority has a value', () => {
				it( 'Should PUT to the correct path with the correct values', async () => {

					const priority = '1';

					await service.barriers.savePriority( req, barrierId, {
						priority,
						priorityDescription: ''
					} );

					expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
						priority: priority,
						priority_summary: null
					} );
				} );
			} );
		} );

		describe( 'saveEuExitRelated', () => {
			it( 'Should PUT to the correct path with the correct values', async () => {

				const euExitRelated = true;

				await service.barriers.saveEuExitRelated( req, barrierId, {
					euExitRelated,
				} );

				expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
					eu_exit_related: euExitRelated,
				} );
			} );
		});

		describe( 'saveProblemStatus', () => {
			it( 'Should PUT to the correct path with the correct values', async () => {

				const status = '1';

				await service.barriers.saveProblemStatus( req, barrierId, {
					status
				} );

				expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
					problem_status: status
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

					expect( backend.get ).toHaveBeenCalledWith( '/reports?ordering=-created_on', token );
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

					expect( backend.get ).toHaveBeenCalledWith( '/reports?ordering=-created_on', token );
				} );
			} );
		} );

		describe( 'getForCountry', () => {

			const countryId = 'def-789';
			const countryUrl = `/reports?export_country=${ countryId }&ordering=-created_on`;

			describe( 'When the results are an array', () => {
				it( 'Should call the correct path and sort the progress', async () => {

					backend.get.and.callFake( () => Promise.resolve( { response: { isSuccess: true }, body: getFakeData( '/backend/reports/' ) } ) );

					const { body } = await service.reports.getForCountry( req, countryId );

					expect( backend.get ).toHaveBeenCalledWith( countryUrl, token );
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

					await service.reports.getForCountry( req, countryId );

					expect( backend.get ).toHaveBeenCalledWith( countryUrl, token );
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
						country: '',
						adminAreas: []
					} );

					expect( backend.post ).toHaveBeenCalledWith( '/reports', token, {
						problem_status: null,
						is_resolved: null,
						resolved_date: null,
						export_country: null,
						country_admin_areas: []
					} );
				} );
			} );

			describe( 'When the values are not empty', () => {

				let status;
				let isResolved;
				let resolvedDate;
				let country;
				let adminAreas;

				beforeEach( () => {

					status = 1;
					isResolved = true;
					resolvedDate = { year: '2018', month:'02' };
					country = uuid();
					adminAreas = [uuid()];
				} );

				describe( 'When isResolved is true', () => {
					it( 'Should POST to the correct path with the values and sector as null', () => {

						service.reports.save( req, {
							status,
							isResolved,
							resolvedDate,
							country,
							adminAreas
						} );

						expect( backend.post ).toHaveBeenCalledWith( '/reports', token, {
							problem_status: status,
							is_resolved: isResolved,
							resolved_date: '2018-02-01',
							export_country: country,
							country_admin_areas: adminAreas
						} );
					} );
				} );

				describe( 'When isResolved is false', () => {
					it( 'Should POST to the correct path with the values and sector as null', () => {

						service.reports.save( req, {
							status,
							isResolved: false,
							resolvedDate,
							country,
							adminAreas
						} );

						expect( backend.post ).toHaveBeenCalledWith( '/reports', token, {
							problem_status: status,
							is_resolved: false,
							resolved_date: '2018-02-01',
							export_country: country,
							country_admin_areas: adminAreas
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
				const isResolved = true;
				const resolvedDate = { year: '2018', month:'02' };
				const country = uuid();
				const adminAreas = [uuid()];

				describe( 'When the resolvedDate has a year and month', () => {

					checkWithAndWithoutValues( 'update', {
						status,
						isResolved,
						resolvedDate,
						country,
						adminAreas
					}, {
						problem_status: status,
						is_resolved: isResolved,
						resolved_date: '2018-02-01',
						export_country: country,
						country_admin_areas: adminAreas
					} );
				} );

				describe( 'When the resolvedDate is an empty object', () => {

					checkWithAndWithoutValues( 'update', {
						status,
						isResolved,
						resolvedDate: {},
						country,
						adminAreas
					}, {
						problem_status: status,
						is_resolved: isResolved,
						resolved_date: null,
						export_country: country,
						country_admin_areas: adminAreas
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

			describe( 'saveAllSectors', () => {

				const allSectors = 'true';

				checkWithAndWithoutValues( 'saveAllSectors', {
					allSectors,
				}, {
					all_sectors: allSectors,
					sectors: []
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
				const barrierTitle = 'c';
				const barrierSource = 'd';
				const euExitRelated = true;
				const barrierSourceOther = 'e';

				checkWithAndWithoutValues( 'saveProblem', {
					item,
					barrierTitle,
					barrierSource,
					euExitRelated,
					barrierSourceOther,
				}, {
					product: item,
					barrier_title: barrierTitle,
					source: barrierSource,
					eu_exit_related: euExitRelated,
					other_source: barrierSourceOther,
				} );
			} );

			describe( 'saveSummary', () => {

				const description = 'b';
				const resolvedDescription = 'f';
				const nextSteps = 'g';

				checkWithAndWithoutValues( 'saveSummary', {
					description,
					resolvedDescription,
					nextSteps
				}, {
					problem_description: description,
					status_summary: resolvedDescription,
					next_steps_summary: nextSteps,
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

		describe( 'delete', () => {
			it( 'Should call the correct path', () => {

				const reportId = 200;

				service.reports.delete( req, reportId );

				expect( backend.delete ).toHaveBeenCalledWith( `/reports/${ reportId }`, token );
			} );
		} );

		describe( 'saveSummaryAndSubmit', () => {

			let reportId;
			let values;
			let backendValues;

			beforeEach( () => {

				reportId = uuid();
				values = {
					description: 'b',
					resolvedDescription: 'f',
					nextSteps: 'g',
				};

				backendValues = {
					problem_description: values.description,
					status_summary: values.resolvedDescription,
					next_steps_summary: values.nextSteps,
				};
			} );

			describe( 'When saveSummary throws an error', () => {
				it( 'Should return the error', async () => {

					const err = { response: { statusCode: 500 } };
					backend.put.and.callFake( () => Promise.reject( err ) );

					try {

						await service.reports.saveSummaryAndSubmit( req, reportId, {} );
						expect( false ).toEqual( true );// should not get here

					} catch( e ){

						expect( e ).toEqual( err );
					}
				} );
			} );

			describe( 'When saveSummary returns a 400', () => {
				it( 'Should return the error', async () => {

					const putResponse = {
						response: { statusCode: 400 },
						body: { a: 1, b: 2 }
					};

					backend.put.and.callFake( () => putResponse );

					const serviceOutput = await service.reports.saveSummaryAndSubmit( req, reportId, values );

					expect( backend.put.calls.count() ).toEqual( 1 );
					expect( backend.put.calls.argsFor( 0 ) ).toEqual( [ `/reports/${ reportId }`, token, backendValues ] );
					expect( serviceOutput ).toEqual( putResponse );
				} );
			} );

			describe( 'When saveSummary returns a 200', () => {
				it( 'Should call saveSummary and submit', async () => {

					backend.put.and.callFake( () => Promise.resolve({ response: { statusCode: 200, isSuccess: true } }) );

					await service.reports.saveSummaryAndSubmit( req, reportId, values );

					expect( backend.put.calls.count() ).toEqual( 2 );
					expect( backend.put.calls.argsFor( 0 ) ).toEqual( [ `/reports/${ reportId }`, token, backendValues ] );
					expect( backend.put.calls.argsFor( 1 ) ).toEqual( [ `/reports/${ reportId }/submit`, token ] );
				} );
			} );
		} );
	} );
} );
