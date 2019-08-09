const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const faker = require( 'faker' );
const metadata = require( './metadata' );

const modulePath = './backend-service';
const getFakeData = jasmine.helpers.getFakeData;
const { RESOLVED, PART_RESOLVED } = metadata.barrier.status.types;

describe( 'Backend Service', () => {

	let token;
	let backend;
	let service;
	let req;
	let metadata;
	let ssoConfig;

	beforeEach( () => {

		token = uuid();
		req = { session: { ssoToken: token } };
		backend = {
			get: jasmine.createSpy( 'backend.get' ),
			post: jasmine.createSpy( 'backend.post' ),
			put: jasmine.createSpy( 'backend.put' ),
			delete: jasmine.createSpy( 'backend.delete' ),
			patch: jasmine.createSpy( 'backend.patch' ),
			raw: {
				get: jasmine.createSpy( 'backend.raw.get' ),
			},
		};
		metadata = {
			getCountry: jasmine.createSpy( 'metadata.country' )
		};
		ssoConfig = { bypass: false };


		service = proxyquire( modulePath, {
			'./backend-request': backend,
			'./metadata': metadata,
			'../config': {
				sso: ssoConfig,
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

			let body;
			let countryResponse;

			beforeEach( () => {

				body = { location: 'test' };
				countryResponse = 'a country';

				backend.get.and.callFake( () => Promise.resolve( { response: { isSuccess: true }, body }) );
				metadata.getCountry.and.callFake( () => countryResponse );
			} );

			afterEach( () => {

				expect( backend.get ).toHaveBeenCalledWith( '/whoami', token );
				expect( body.country ).toEqual( countryResponse );
			} );

			describe( 'When sso bypass is false', () => {
				it( 'Should call the correct path and transform the response', async () => {

					await service.getUser( req );

					expect( body.permitted_applications ).not.toBeDefined();
				} );
			} );

			describe( 'When sso bypass is true', () => {
				it( 'Should call the correct path and transform the response', async () => {

					ssoConfig.bypass = true;

					await service.getUser( req );

					expect( body.permitted_applications ).toEqual( [
						{
							'key': 'datahub-crm',
						},
						{
							'key': 'market-access',
						}
					] );
				} );
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

	describe( 'getSsoUser', () => {
		describe( 'When the response is not a success', () => {
			it( 'Should call the correct path and return the response with body', async () => {

				const userId = uuid();

				backend.get.and.callFake( () => Promise.reject( {
					response: { isSuccess: false }
				} ));

				try {

					await service.getSsoUser( req, userId );
					fail();

				} catch( e ){

					expect( backend.get ).toHaveBeenCalledWith( `/users/${ userId }`, token );
				}
			} );
		} );

		describe( 'When the response is a success', () => {
			it( 'Should call the correct path', async () => {

				const userId = uuid();
				const mockBody = {
					id: 123,
					first_name: 'abc',
					last_name: 'def',
					profile: {
						sso_user_id: uuid(),
					}
				};
				const expectedBody = {
					...JSON.parse( JSON.stringify( mockBody, null, 2 ) ),
					user_id: mockBody.profile.sso_user_id,
				};

				backend.get.and.callFake( () => Promise.resolve( {
					response: { isSuccess: true },
					body: mockBody,
				} ));

				const { response, body } = await service.getSsoUser( req, userId );

				expect( backend.get ).toHaveBeenCalledWith( `/users/${ userId }`, token );
				expect( response.isSuccess ).toEqual( true );
				expect( body ).toEqual( expectedBody );
			} );
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

	describe( 'watchList', () => {
		describe( 'save', () => {
			it( 'Should call backend.patch with the correct data', async () => {

				const profile = { a: 1 };

				await service.watchList.save( req, profile );

				expect( backend.patch ).toHaveBeenCalledWith( '/whoami', token, { user_profile: profile } );
			} );
		} );
	} );

	describe( 'Barriers', () => {

		let barrierId;

		beforeEach( () => {

			barrierId = uuid();
		} );

		describe( 'getAll', () => {

			async function testWithOrdering( filters, expectedParams ){

				const path = ( '/barriers?' + ( expectedParams ? expectedParams + '&' : '' ) );

				await service.barriers.getAll( req, filters );

				expect( backend.get ).toHaveBeenCalledWith( `${ path }ordering=-reported_on`, token );

				await service.barriers.getAll( req, filters, 'reported_on' );

				expect( backend.get ).toHaveBeenCalledWith( `${ path }ordering=-reported_on`, token );

				await service.barriers.getAll( req, filters, 'reported_on', 'desc' );

				expect( backend.get ).toHaveBeenCalledWith( `${ path }ordering=-reported_on`, token );

				await service.barriers.getAll( req, filters, 'reported_on', 'asc' );

				expect( backend.get ).toHaveBeenCalledWith( `${ path }ordering=reported_on`, token );
			}

			describe( 'With no filters', () => {
				it( 'Should call the correct path with default sort order', () => {

					testWithOrdering();
				} );
			} );

			describe( 'With a country filter', () => {
				it( 'Should call the correct path with default sort order', () => {

					const country = uuid();

					testWithOrdering( { country }, `location=${ country }` );
				} );
			} );

			describe( 'With an overseas region filter', () => {
				it( 'Should call the correct path with default sort order', () => {

					const region = uuid();

					testWithOrdering( { region }, `location=${ region }` );
				} );
			} );

			describe( 'With a country and an overseas region filter', () => {
				it( 'Should call the correct path with default sort order', () => {

					const country = uuid();
					const region = uuid();

					testWithOrdering( { region, country }, `location=${ country },${ region }` );
				} );
			} );

			describe( 'With a sector filter', () => {
				it( 'Should call the correct path with default sort order', () => {

					const sector = uuid();

					testWithOrdering( { sector }, `sector=${ sector }` );
				} );
			} );

			describe( 'With a type filter', () => {
				it( 'Should call the correct path with default sort order', () => {

					const type = faker.lorem.word().toUpperCase();

					testWithOrdering( { type }, `barrier_type=${ type }` );
				} );
			} );

			describe( 'With a status filter', () => {
				it( 'Should call the correct path with default sort order', () => {

					const status = '2,5';

					testWithOrdering( { status }, `status=${ encodeURIComponent( status ) }` );
				} );
			} );

			describe( 'With a search filter', () => {
				it( 'Should call the correct path, urlencode the value, use default sort order', async () => {

					const search = 'testing with %';

					testWithOrdering( { search }, `text=${ encodeURIComponent( search ) }` );
				} );
			} );

			describe( 'With a user filter', () => {
				it( 'Should call the correct path, urlencode the value, use default sort order', async () => {

					const createdBy = '123';

					testWithOrdering( { createdBy }, `user=1` );
				} );
			} );
		} );

		describe( 'download', () => {

			function testWithOrdering( filters, expectedParams ){

				const path = ( '/barriers/export?' + ( expectedParams ? expectedParams + '&' : '' ) );

				service.barriers.download( req, filters );

				expect( backend.raw.get ).toHaveBeenCalledWith( `${ path }ordering=-reported_on`, token );

				service.barriers.download( req, filters, 'reported_on' );

				expect( backend.raw.get ).toHaveBeenCalledWith( `${ path }ordering=-reported_on`, token );

				service.barriers.download( req, filters, 'reported_on', 'desc' );

				expect( backend.raw.get ).toHaveBeenCalledWith( `${ path }ordering=-reported_on`, token );

				service.barriers.download( req, filters, 'reported_on', 'asc' );

				expect( backend.raw.get ).toHaveBeenCalledWith( `${ path }ordering=reported_on`, token );
			}

			describe( 'With no filters', () => {
				it( 'Should call the correct path with default sort order', () => {

					testWithOrdering();
				} );
			} );

			describe( 'With a country filter', () => {
				it( 'Should call the correct path with default sort order', () => {

					const country = uuid();

					testWithOrdering( { country }, `location=${ country }` );
				} );
			} );

			describe( 'With an overseas region filter', () => {
				it( 'Should call the correct path with default sort order', () => {

					const region = uuid();

					testWithOrdering( { region }, `location=${ region }` );
				} );
			} );

			describe( 'With a country and an overseas region filter', () => {
				it( 'Should call the correct path with default sort order', () => {

					const country = uuid();
					const region = uuid();

					testWithOrdering( { region, country }, `location=${ country },${ region }` );
				} );
			} );

			describe( 'With a sector filter', () => {
				it( 'Should call the correct path with default sort order', () => {

					const sector = uuid();

					testWithOrdering( { sector }, `sector=${ sector }` );
				} );
			} );

			describe( 'With a type filter', () => {
				it( 'Should call the correct path with default sort order', () => {

					const type = faker.lorem.word().toUpperCase();

					testWithOrdering( { type }, `barrier_type=${ type }` );
				} );
			} );

			describe( 'With a status filter', () => {
				it( 'Should call the correct path with default sort order', async () => {

					const status = '2,5';

					testWithOrdering( { status }, `status=${ encodeURIComponent( status ) }` );
				} );
			} );

			describe( 'With a search filter', () => {
				it( 'Should call the correct path, urlencode the value, use default sort order', async () => {

					const search = 'testing with %';

					testWithOrdering( { search }, `text=${ encodeURIComponent( search ) }` );
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

		describe( 'status', () => {

			describe( 'unknown', () => {
				it( 'Should PUT to the correct path with the correct values', async () => {

					const unknownSummary = 'my summary text';

					await service.barriers.setStatus.unknown( req, barrierId, {
						unknownSummary
					} );

					expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }/unknown`, token, {
						status_summary: unknownSummary
					} );
				} );
			} );

			describe( 'pending', () => {
				describe( 'With OTHER', () => {
					it( 'Should PUT to the correct path with the correct values', async () => {

						const pendingSummary = 'my summary text';
						const pendingType = 'OTHER';
						const pendingTypeOther = faker.lorem.words( 4 );

						await service.barriers.setStatus.pending( req, barrierId, {
							pendingSummary,
							pendingType,
							pendingTypeOther,
						} );

						expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }/open-action_required`, token, {
							status_summary: pendingSummary,
							sub_status: pendingType,
							sub_status_other: pendingTypeOther,
						} );
					} );
				} );

				describe( 'Without OTHER', () => {
					it( 'Should PUT to the correct path with the correct values', async () => {

						const pendingSummary = 'my summary text';
						const pendingType = 'OTHER';

						await service.barriers.setStatus.pending( req, barrierId, {
							pendingSummary,
							pendingType,
						} );

						expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }/open-action_required`, token, {
							status_summary: pendingSummary,
							sub_status: pendingType,
							sub_status_other: null,
						} );
					} );
				} );
			} );

			describe( 'open', () => {
				it( 'Should PUT to the correct path with the correct values', async () => {

					const reopenSummary = 'my summary text';

					await service.barriers.setStatus.open( req, barrierId, {
						reopenSummary
					} );

					expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }/open-in-progress`, token, {
						status_summary: reopenSummary
					} );
				} );
			} );

			describe( 'partResolve', () => {
				it( 'Should PUT to the correct path with the correct values', async () => {

					const [ month, year ] = [ '11', '2000' ];
					const partResolvedSummary = 'my summary text';

					await service.barriers.setStatus.partResolved( req, barrierId, {
						partResolvedDate: { month, year },
						partResolvedSummary
					} );

					expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }/resolve-in-part`, token, {
						status_date: [ year, month, '01' ].join( '-' ),
						status_summary: partResolvedSummary
					} );
				} );
			} );

			describe( 'resolve', () => {
				it( 'Should PUT to the correct path with the correct values', async () => {

					const [ month, year ] = [ '11', '2000' ];
					const resolvedSummary = 'my summary text';

					await service.barriers.setStatus.resolved( req, barrierId, {
						resolvedDate: { month, year },
						resolvedSummary
					} );

					expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }/resolve-in-full`, token, {
						status_date: [ year, month, '01' ].join( '-' ),
						status_summary: resolvedSummary
					} );
				} );
			} );

			describe( 'hibernate', () => {
				it( 'Should PUT to the correct path with the correct values', async () => {

					const hibernationSummary = 'my summary text';

					await service.barriers.setStatus.hibernated( req, barrierId, {
						hibernationSummary
					} );

					expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }/hibernate`, token, {
						status_summary: hibernationSummary
					} );
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
			let allSectors;
			beforeEach( () => {
				allSectors = false;
			} );

			describe( 'With no sectors', () => {
				it( 'Should PUT to the correct path with a null value', async () => {

					const sectors = [];

					await service.barriers.saveSectors( req, barrierId, sectors, allSectors );

					expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
						sectors: null,
						sectors_affected: false,
						all_sectors: allSectors
					} );
				} );
			} );

			describe( 'With a list of sectors', () => {
				it( 'Should PUT to the correct path with the correct values', async () => {

					const sectors = [ 'sector 1', 'sector 2' ];

					await service.barriers.saveSectors( req, barrierId, sectors, allSectors );

					expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
						sectors,
						sectors_affected: true,
						all_sectors: allSectors
					} );
				} );
			} );

			describe( 'With all sectors', () => {
				it( 'Should PUT to the correct path with the correct values', async () => {

					const sectors = null;
					allSectors = true;

					await service.barriers.saveSectors( req, barrierId, sectors, allSectors );

					expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
						sectors,
						sectors_affected: true,
						all_sectors: allSectors
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

				const problemStatus = '1';

				await service.barriers.saveProblemStatus( req, barrierId, {
					problemStatus
				} );

				expect( backend.put ).toHaveBeenCalledWith( `/barriers/${ barrierId }`, token, {
					problem_status: problemStatus
				} );
			} );
		} );

		describe( 'team', () => {
			describe( 'get', () => {
				it( 'Should GET the correct path', async () => {

					await service.barriers.team.get( req, barrierId );

					expect( backend.get ).toHaveBeenCalledWith( `/barriers/${ barrierId }/members`, token );
				} );
			} );

			describe( 'add', () => {
				it( 'Should POST to the correct path with the correct values', async () => {

					const values = {
						memberId: uuid(),
						role: 'A role here',
					};

					await service.barriers.team.add( req, barrierId, values );

					expect( backend.post ).toHaveBeenCalledWith( `/barriers/${ barrierId }/members`, token, {
						user: { profile: { sso_user_id: values.memberId } },
						role: values.role,
					} );
				} );
			} );

			describe( 'delete', () => {
				it( 'Should DELETE to the correct path', async () => {

					const memberId = uuid();

					await service.barriers.team.delete( req, memberId );

					expect( backend.delete ).toHaveBeenCalledWith( `/barriers/members/${ memberId }`, token );
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
						is_resolved: false,
						resolved_status: null,
						resolved_date: null,
						export_country: null,
						country_admin_areas: []
					} );
				} );
			} );

			describe( 'When the values are not empty', () => {

				let status;
				let resolvedDate;
				let country;
				let adminAreas;

				beforeEach( () => {

					status = 1;
					resolvedDate = { year: '2018', month:'02' };
					country = uuid();
					adminAreas = [uuid()];
				} );

				describe( 'When isResolved is RESOLVED', () => {
					it( 'Should POST to the correct path with the values and sector as null', () => {

						service.reports.save( req, {
							status,
							isResolved: RESOLVED,
							resolvedDate,
							country,
							adminAreas
						} );

						expect( backend.post ).toHaveBeenCalledWith( '/reports', token, {
							problem_status: status,
							is_resolved: true,
							resolved_status: RESOLVED,
							resolved_date: '2018-02-01',
							export_country: country,
							country_admin_areas: adminAreas
						} );
					} );
				} );

				describe( 'When isResolved is PART_RESOLVED', () => {
					it( 'Should POST to the correct path with the values and sector as null', () => {

						service.reports.save( req, {
							status,
							isResolved: PART_RESOLVED,
							partResolvedDate:	{ partMonth: resolvedDate.month, partYear: resolvedDate.year },
							country,
							adminAreas
						} );

						expect( backend.post ).toHaveBeenCalledWith( '/reports', token, {
							problem_status: status,
							is_resolved: true,
							resolved_status: PART_RESOLVED,
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
							isResolved: 'false',
							resolvedDate,
							country,
							adminAreas
						} );

						expect( backend.post ).toHaveBeenCalledWith( '/reports', token, {
							problem_status: status,
							is_resolved: false,
							resolved_status: null,
							resolved_date: null,
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
							nullBackendData[ key ] = ( key === 'is_resolved' ? false : null );
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
				const isResolved = RESOLVED;
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
						is_resolved: true,
						resolved_status: RESOLVED,
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
						is_resolved: true,
						resolved_status: RESOLVED,
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
					sectors_affected: hasSectors,
					all_sectors: null,
					sectors: null,
				} );
			} );

			describe( 'saveAllSectors', () => {

				const allSectors = 'true';

				checkWithAndWithoutValues( 'saveAllSectors', {
					allSectors,
				}, {
					all_sectors: allSectors,
					sectors: null
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
