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
						body: getFakeData( '/backend/metadata/' )
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

		let uniqueBarrierTypes;

		beforeEach( async () => {

			const body = getFakeData( '/backend/metadata/' );

			uniqueBarrierTypes = [ ...body.barrier_types ];
			body.barrier_types.push( fakeData.barrier_types[ 0 ], fakeData.barrier_types[ 1 ] );

			backend.get.and.callFake( () => Promise.resolve( {
				response: { isSuccess: true },
				body
			} ) );

			await metadata.fetch();
		} );

		describe( 'statusTypes', () => {
			it( 'Should return the data', () => {

				expect( metadata.statusTypes ).toBeDefined();
				expect( metadata.statusTypes ).toEqual( {
					'1': 'A procedural/short-term barrier',
					'2': 'A long term strategic barrier'
				} );
			} );
		} );

		describe( 'lossScale', () => {
			it( 'Should return the data', () => {

				expect( metadata.lossScale ).toBeDefined();
				expect( metadata.lossScale ).toEqual( fakeData.loss_range );
			} );
		} );

		describe( 'optionalBool', () => {
			it( 'Should return the data', () => {

				expect( metadata.optionalBool ).toBeDefined();
				expect( metadata.optionalBool ).toEqual( fakeData.adv_boolean );
			} );
		} );

		describe( 'countries', () => {
			it( 'Should return the data', () => {

				const output = [
					fakeData.countries[ 0 ],
					fakeData.countries[ 1 ],
					fakeData.countries[ 2 ],
					fakeData.countries[ 4 ],
				].map( ( { id, name } ) => ({ id, name }) );

				expect( metadata.countries ).toEqual( output );
			} );
		} );

		describe( 'getCountry', () => {
			it( 'Should get the country', () => {

				const country = {
					id: fakeData.countries[ 2 ].id,
					name: fakeData.countries[ 2 ].name
				};

				expect( metadata.getCountry( '9a662aa0-99ba-4f3b-835a-859fe210e9c2' ) ).toEqual( country );
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

		describe( 'overseasRegions', () => {
			it( 'Should return the data', () => {

				expect( metadata.overseasRegions ).toEqual( [
					fakeData.countries[ 4 ].overseas_region,
					fakeData.countries[ 2 ].overseas_region,
				] );
			} );
		} );

		describe( 'getOverseasRegion', () => {
			it( 'Should get the region', () => {

				const region = {
					id: fakeData.countries[ 2 ].overseas_region.id,
					name: fakeData.countries[ 2 ].overseas_region.name
				};

				expect( metadata.getOverseasRegion( 'd9fdeed8-247e-4f54-8fd2-e86077e9faf3' ) ).toEqual( region );
			} );
		} );

		describe( 'getOverseasRegionList', () => {
			describe( 'Without specifying the default text', () => {
				it( 'Should create a region list for use with a select - with a default choose option', () => {

					const regions = metadata.getOverseasRegionList();

					expect( regions.length ).toEqual( metadata.overseasRegions.length + 1 );
					expect( regions[ 0 ] ).toEqual( { value: '', text: 'Choose overseas region' } );

					regions.forEach( ( region ) => {
						expect( region.value ).toBeDefined();
						expect( region.text ).toBeDefined();
					});
				} );
			} );

			describe( 'Specifying the default text', () => {
				it( 'Should create a region list for use with a select - with the specified choose option', () => {

					const text = 'Select an option';
					const regions = metadata.getOverseasRegionList( text );

					expect( regions.length ).toEqual( metadata.overseasRegions.length + 1 );
					expect( regions[ 0 ] ).toEqual( { value: '', text } );

					regions.forEach( ( region ) => {
						expect( region.value ).toBeDefined();
						expect( region.text ).toBeDefined();
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
						"name": "Add a barrier",
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
				expect( metadata.barrierTypes ).toEqual( uniqueBarrierTypes );
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

		describe( 'adminAreas', () => {

			let nonDisabledAdminAreas;
			let adminAreasByCountry;
			let countryId;

			beforeEach( () => {
				nonDisabledAdminAreas = fakeData.country_admin_areas.filter( ( adminArea ) => adminArea.disabled_on === null );
			});

			describe( 'adminAreas', () => {
				it( 'Should return all admin areas', () => {
					expect( metadata.adminAreas ).toEqual( nonDisabledAdminAreas );
				});
			});

			describe( 'adminAreasByCountry', () => {
				it('Should return an object containing all countries with their corresponding admin areas', () => {
					adminAreasByCountry = metadata.adminAreasByCountry;

					expect( Object.keys( adminAreasByCountry ).length ).toEqual( 2 );
					expect( Object.keys( adminAreasByCountry ) ).toEqual(
						[ '81756b9a-5d95-e211-a939-e4115bead28a', '5daf72a6-5d95-e211-a939-e4115bead28a' ]
					);
				});
			});

			describe( 'getCountryAdminAreasList', () => {

				beforeEach( () => {
					countryId = '81756b9a-5d95-e211-a939-e4115bead28a';
					adminAreasByCountry = metadata.adminAreasByCountry;
				});

				describe( 'Without specifying the default text', () => {
					it( 'Should return all admin areas that are not disabled for the selected country', () => {

						const affectedAdminAreasList = adminAreasByCountry[countryId].map( ( adminArea ) => ({ value: adminArea.id, text: adminArea.name } ) );

						affectedAdminAreasList.unshift( { value: '', text: 'Select an admin area' } );

						expect( metadata.getCountryAdminAreasList( countryId ) ).toEqual( affectedAdminAreasList );
					} );
				} );

				describe( 'Specifying the default text', () => {
					it( 'Should return all admin areas that are not disabled for the selected country', () => {

						const text = 'All admin areas';
						const affectedAdminAreasList = adminAreasByCountry[ countryId ].map( ( adminArea ) => ({ value: adminArea.id, text: adminArea.name } ) );

						affectedAdminAreasList.unshift( { value: '', text } );

						expect( metadata.getCountryAdminAreasList( countryId, text ) ).toEqual( affectedAdminAreasList );
					} );
				} );
			} );

			describe( 'isCountryWithAdminArea', () => {
				describe( 'with a valid country', () => {
					it( 'Should return true', () => {
						expect( metadata.isCountryWithAdminArea( '81756b9a-5d95-e211-a939-e4115bead28a' ) ).toEqual( true );
					});
				});
				describe( 'without a valid country', () => {
					it( 'Should return false', () => {
						expect( metadata.isCountryWithAdminArea( '81756b9a-5d95-e211-a939-e4115bxyd78a' ) ).toEqual( false );
					});
				});
			});
		});

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

		describe( 'getSector', () => {
			it( 'Should get the country', () => {

				expect( metadata.getSector( 'ecb89515-9df1-4432-b191-d4b41ad2eb39' ) ).toEqual( fakeData.sectors[ 1 ] );
			} );
		} );

		describe( 'getBarrierType', () => {
			it( 'Should return the item', () => {

				expect( metadata.getBarrierType( fakeData.barrier_types[ 3 ].id ) ).toEqual( fakeData.barrier_types[ 3 ] );
			} );
		} );

		describe( 'getBarrierTypeList', () => {
			it( 'Should return the list', () => {

				const expected = fakeData.barrier_types.map( ( { id, title } ) => ({ value: id, text: title }) );

				expected.unshift( { value: '', text: 'All barrier types' } );

				expect( metadata.getBarrierTypeList() ).toEqual( expected );
			} );
		} );

		describe( 'barrierSource', () => {
			it( 'Should return a list', () => {

				expect( metadata.barrierSource ).toBeDefined();
				expect( metadata.barrierSource ).toEqual( fakeData.barrier_source );
			} );
		} );

		describe( 'getBarrierPriority', () => {
			it( 'Should return the list', () => {

				const item = fakeData.barrier_priorities[ 2 ];
				const expected = {
					...item,
					modifier: item.code.toLowerCase()
				};

				expect( metadata.getBarrierPriority( item.code ) ).toEqual( expected );
			} );
		} );

		describe( 'barrierPriorities', () => {

			let expectedOrder;

			beforeEach( () => {

				const list = fakeData.barrier_priorities;
				expectedOrder = [ list[ 2 ], list[ 3 ], list[ 0 ], list[ 1 ] ].map( ( item ) => ({ ...item, modifier: item.code.toLowerCase() }) );
			} );

			it( 'Should return the list in the correct order with a modifier property added', () => {

				expect( metadata.barrierPriorities ).toBeDefined();
				expect( metadata.barrierPriorities ).toEqual( expectedOrder );
			} );

			it( 'Should create a map of the priorities', () => {

				expect( metadata.barrierPrioritiesMap ).toEqual( expectedOrder.reduce( ( map, item ) => {

					map[ item.code ] = item;

					return map;

				}, {} ) );
			} );

			describe( 'getBarrierPrioritiesList', () => {
				describe( 'Without any params', () => {
					it( 'Should return the list in the correct order', () => {

						expect( metadata.getBarrierPrioritiesList() ).toEqual( expectedOrder.map( ( { code, name } ) => ({
							value: code,
							html: `<span class="priority-marker priority-marker--${ code.toLowerCase() }"></span><strong>${ name }</strong> priority`
						}) ) );
					} );
				} );

				describe( 'With suffix: false', () => {
					it( 'Should return the list in the correct order without a suffix', () => {

						expect( metadata.getBarrierPrioritiesList( { suffix: false } ) ).toEqual( expectedOrder.map( ( { code, name } ) => ({
							value: code,
							html: `<span class="priority-marker priority-marker--${ code.toLowerCase() }"></span>${ name }`
						}) ) );
					} );
				} );
			} );
		} );

		describe( 'Barier status', () => {

			let validList;

			beforeEach( () => {
				validList = { ...fakeData.barrier_status };
				delete validList[ 0 ];
				delete validList[ 6 ];
			} );

			describe( 'barrierStatuses', () => {
				it( 'Should return the object', () => {

					expect( metadata.barrierStatuses ).toBeDefined();
					expect( metadata.barrierStatuses ).toEqual( validList );
				} );
			} );

			describe( 'getBarrierStatus', () => {
				it( 'Should return the object', () => {

					expect( metadata.getBarrierStatus( '1' ) ).toEqual( validList[ '1' ] );
				} );
			} );

			describe( 'getBarrierStatusList', () => {
				it( 'Should return a list', () => {

					const expected = Object.entries( validList ).map( ( [ id, name ] ) => ({ value: id, text: name }) );

					expect( metadata.getBarrierStatusList() ).toEqual( expected );
				} );
			} );
		} );

		describe( 'barrier', () => {
			describe( 'status.types', () => {
				it( 'Updates the name with the value from the metadata', () => {

					for( let [ key, item ] of Object.entries( metadata.barrier.status.typeInfo ) ){

						expect( item.name ).toEqual( fakeData.barrier_status[ key ] );
					}
				} );
			} );
		} );
	} );

	describe( 'static data', () => {
		describe( 'mimeTypes', () => {
			it( 'Should create a map of types to extension', () => {

				expect( metadata.mimeTypes ).toBeDefined();
				expect( metadata.mimeTypes[ 'text/plain' ] ).toEqual( '.txt' );
			} );
		} );

		describe( 'barrier', () => {
			it( 'Should expose the required data', () => {

				const UNKNOWN = 7;
				const PENDING = 1;
				const OPEN = 2;
				const PART_RESOLVED = 3;
				const RESOLVED = 4;
				const HIBERNATED = 5;

				expect( metadata.barrier ).toEqual( {
					status: {
						types: {
							UNKNOWN,
							PENDING,
							OPEN,
							PART_RESOLVED,
							RESOLVED,
							HIBERNATED
						},
						typeInfo: {
							[ UNKNOWN ]: { name: 'Unknown', modifier: 'hibernated', hint: 'Barrier requires further work for the status to be known' },
							[ PENDING ]: { name: 'Pending', modifier: 'assessment', hint: 'Barrier is awaiting action' },
							[ OPEN ]: { name: 'Open', modifier: 'assessment', hint: 'Barrier is being worked on' },
							[ PART_RESOLVED ]: { name: 'Part resolved', modifier: 'resolved', hint: 'Barrier has been resolved for specific UK companies but not all. Barrier impact has been significantly reduced but remains in part' },
							[ RESOLVED ]: { name: 'Resolved', modifier: 'resolved', hint: 'Barrier has been resolved for all UK companies' },
							[ HIBERNATED ]: { name: 'Paused', modifier: 'hibernated', hint: 'Barrier is present but not being persued' },
						}
					},
					priority: {
						codes: {
							UNKNOWN: 'UNKNOWN'
						}
					}
				} );
			} );
		} );
	} );
} );
