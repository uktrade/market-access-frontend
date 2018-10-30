const proxyquire = require( 'proxyquire' );
const modulePath = './metadata';

const getFakeData = jasmine.helpers.getFakeData;

describe( 'metadata', () => {

	let metadata;
	let backend;
	let fakeData;

	beforeEach( () => {

		fakeData = getFakeData( '/backend/metadata/' );

		backend = {
			get: jasmine.createSpy( 'backend.get' )
		};

		metadata = proxyquire( modulePath, {
			'./backend-request': backend
		} );
	} );

	describe( 'fetch', () => {
		describe( 'Without an error', () => {
			describe( 'A successful response', () => {
				it( 'Should report no errors', async () => {

					backend.get.and.callFake( () => Promise.resolve( {
						response: { isSuccess: true },
						body: fakeData
					} ) );

					await metadata.fetch();
				} );
			} );

			describe( 'An unsuccessful response', () => {
				it( 'Should throw an error', async () => {

					backend.get.and.callFake( () => Promise.resolve( {
						response: { isSuccess: false }
					} ) );

					try {

						await metadata.fetch();

					} catch( e ){

						expect( e ).toEqual( new Error( 'Unable to fetch metadata' ) );
					}
				} );
			} );
		} );

		describe( 'With an error', () => {
			it( 'Should throw the error', async () => {

				const theErr = new Error( 'test' );

				backend.get.and.callFake( () => { throw theErr; } );

				try {

					await metadata.fetch();

				} catch( e ){

					expect( e ).toEqual( theErr );
				}
			} );
		} );
	} );

	describe( 'With fakeData', () => {

		beforeEach( async () => {

			backend.get.and.callFake( () => Promise.resolve( {
				response: { isSuccess: true },
				body: fakeData
			} ) );

			await metadata.fetch();
		} );

		describe( 'statusTypes', () => {
			it( 'Should return the data', () => {

				expect( metadata.statusTypes ).toBeDefined();
				expect( metadata.statusTypes ).toEqual( fakeData.status_types );
			} );
		} );

		describe( 'lossScale', () => {
			it( 'Should return the data', () => {

				expect( metadata.lossScale ).toBeDefined();
				expect( metadata.lossScale ).toEqual( fakeData.loss_range );
			} );
		} );

		describe( 'boolScale', () => {
			it( 'Should return the data', () => {

				expect( metadata.boolScale ).toBeDefined();
				expect( metadata.boolScale ).toEqual( fakeData.adv_boolean );
			} );
		} );

		describe( 'countries', () => {
			it( 'Should return the data', () => {

				const output = [
					fakeData.countries[ 0 ],
					fakeData.countries[ 1 ]
				].map( ( { id, name } ) => ({ id, name }) );

				expect( metadata.countries ).toEqual( output );
			} );
		} );

		describe( 'getCountryList', () => {
			describe( 'Without specifying the default text', () => {
				it( 'Should create a country list for use with a select - with a default choose option', () => {

					const countries = metadata.getCountryList();

					expect( countries.length ).toEqual( metadata.countries.length + 1 );
					expect( countries[ 0 ] ).toEqual( { value: '', text: 'Choose a country' } );

					countries.forEach( ( country ) => {
						expect( country.value ).toBeDefined();
						expect( country.text ).toBeDefined();
					});
				} );
			} );

			describe( 'Specifying the default text', () => {
				it( 'Should create a country list for use with a select - with the specified choose option', () => {

					const text = 'Select an option';
					const countries = metadata.getCountryList( text );

					expect( countries.length ).toEqual( metadata.countries.length + 1 );
					expect( countries[ 0 ] ).toEqual( { value: '', text } );

					countries.forEach( ( country ) => {
						expect( country.value ).toBeDefined();
						expect( country.text ).toBeDefined();
					});
				} );
			} );
		} );

		describe( 'govResponse', () => {
			it( 'Should return the data', () => {

				expect( metadata.govResponse ).toBeDefined();
				expect( metadata.govResponse ).toEqual( fakeData.govt_response );
			} );
		} );

		describe( 'publishResponse', () => {
			it( 'Should retur the data', () => {

				expect( metadata.publishResponse ).toBeDefined();
				expect( metadata.publishResponse ).toEqual( fakeData.publish_response );
			} );
		} );

		describe( 'reportStages', () => {
			it( 'Should return the data', () => {

				expect( metadata.reportStages ).toBeDefined();
				expect( metadata.reportStages ).toEqual( fakeData.report_stages );
			} );
		} );

		describe( 'reportTaskList', () => {
			it( 'Should create the list from the reportStages', () => {
				//console.log( JSON.stringify( metadata.reportTaskList, null ,2 ) );
				expect( metadata.reportTaskList ).toEqual( [
					{
						"stage": "1.0",
						"name": "doloremque qui ipsum",
						"items": [
							{
								"stage": "1.1",
								"name": "non dolorem eaque"
							},{
								"stage": "1.2",
								"name": "soluta dolores est"
							},{
								"stage": "1.3",
								"name": "vero ducimus dolores"
							},{
								"stage": "1.4",
								"name": "atque aut numquam"
							},{
								"stage": "1.5",
								"name": "doloremque at ullam"
							},{
								"stage": "1.6",
								"name": "sapiente quas itaque"
							},{
								"stage": "1.7",
								"name": "delectus dolores aliquid"
							}
						],
						"number": true
					},
					{
						"stage": "2.0",
						"name": "dolorem cum accusantium",
						"items": [
							{
								"stage": "2.1",
								"name": "ipsam dolor illo"
							},{
								"stage": "2.2",
								"name": "et eligendi repellendus"
							}
						],
						"number": true
					}
				] );
			} );
		} );

		describe( 'barrierTypes', () => {
			it( 'Should return the list', () => {

				expect( metadata.barrierTypes ).toBeDefined();
				expect( metadata.barrierTypes ).toEqual( fakeData.barrier_types );
			} );
		} );

		describe( 'barrierTypeCategories', () => {
			it( 'Should return the list', () => {

				expect( metadata.barrierTypeCategories ).toBeDefined();
				expect( metadata.barrierTypeCategories ).toEqual( fakeData.barrier_type_categories );
			} );
		} );

		describe( 'supportType', () => {
			it( 'Should return the data', () => {

				expect( metadata.supportType ).toBeDefined();
				expect( metadata.supportType ).toEqual( fakeData.support_type );
			} );
		} );

		describe( 'bool', () => {
			it( 'Should return the data', () => {

				expect( metadata.bool ).toBeDefined();
				expect( metadata.bool ).toEqual( {
					'true': 'Yes',
					'false': 'No'
				} );
			} );
		} );

		describe( 'sectors', () => {

			let nonDisabledSectors;
			let level0Sectors;

			beforeEach( () => {

				nonDisabledSectors = fakeData.sectors.filter( ( sector ) => sector.disabled_on === null );
				level0Sectors = nonDisabledSectors.filter( ( sector ) => sector.level === 0 );
			} );

			describe( 'sectors', () => {
				it( 'Should return all sectors that are not disabled', () => {

					expect( metadata.sectors ).toEqual( nonDisabledSectors );
				} );
			} );

			describe( 'level0Sectors', () => {
				it( 'Should return all sectors that are not disabled and have a level of 0', () => {

					expect( metadata.level0Sectors ).toEqual( level0Sectors );
				} );
			} );

			describe( 'getSectorList', () => {
				describe( 'Without specifying the default text', () => {
					it( 'Should return all sectors that are not disabled and have a level of 0 in a govuk formate', () => {

						const affectedSectorsList = level0Sectors.map( ( sector ) => ({ value: sector.id, text: sector.name } ) );

						affectedSectorsList.unshift( { value: '', text: 'Select a sector' } );

						expect( metadata.getSectorList() ).toEqual( affectedSectorsList );
					} );
				} );

				describe( 'Specifying the default text', () => {
					it( 'Should return all sectors that are not disabled and have a level of 0 in a govuk format', () => {

						const text = 'All sectors';
						const affectedSectorsList = level0Sectors.map( ( sector ) => ({ value: sector.id, text: sector.name } ) );

						affectedSectorsList.unshift( { value: '', text } );

						expect( metadata.getSectorList( text ) ).toEqual( affectedSectorsList );
					} );
				} );
			} );
		} );

		describe( 'getBarrierTypeList', () => {
			it( 'Should return the list', () => {

				const expected = fakeData.barrier_types.map( ( { id, title } ) => ({ value: id, text: title }) );
				expected.unshift( { value: '', text: 'All barrier types' } );

				expect( metadata.getBarrierTypeList() ).toEqual( expected );
			} );
		} );

		describe( 'barrierAwareness', () => {
			it( 'Should return a list', () => {

				expect( metadata.barrierAwareness ).toBeDefined();
				expect( metadata.barrierAwareness ).toEqual( fakeData.barrier_source );
			} );
		} );
	} );
} );
