const urls = require( './urls' );
const uuid = require( 'uuid/v4' );

describe( 'URLs', () => {

	describe( 'Index', () => {
		describe( 'Without params', () => {
			it( 'Should return the correct path', () => {

				expect( urls.index() ).toEqual( '/' );
			} );
		} );

		describe( 'With a watchListIndex', () => {
			it( 'Should return the correct path', () => {

				expect( urls.index( 0 ) ).toEqual( '/' );
				expect( urls.index( 1 ) ).toEqual( '/?list=1' );
				expect( urls.index( 2 ) ).toEqual( '/?list=2' );
			} );
		} );

		describe( 'With a watchListIndex and params', () => {
			it( 'Should return the correct path', () => {

				expect( urls.index( 0, {} ) ).toEqual( '/' );
				expect( urls.index( 0, { test1: '1' } ) ).toEqual( '/?test1=1' );
				expect( urls.index( 0, { test1: '1', test2: '2' } ) ).toEqual( '/?test1=1&test2=2' );
				expect( urls.index( 1, { test1: '1' } ) ).toEqual( '/?test1=1&list=1' );
				expect( urls.index( 1, { test1: '1', test2: '2' } ) ).toEqual( '/?test1=1&test2=2&list=1' );
			} );
		} );
	} );

	describe( 'me', () => {
		it( 'Should return the correct path', () => {

			expect( urls.me() ).toEqual( '/me' );
		} );
	} );

	describe( 'Login', () => {
		it( 'Should return the login path', () => {

			expect( urls.login() ).toEqual( '/login/' );
		} );
	} );

	describe( 'What is a barrier', () => {
		it( 'Should return the correct path', () => {

			expect( urls.whatIsABarrier() ).toEqual( '/what-is-a-barrier/' );
		} );
	} );

	describe( 'Find a barrier', () => {
		describe( 'Without any filters', () => {
			it( 'Should return the correct path', () => {

				expect( urls.findABarrier() ).toEqual( '/find-a-barrier/' );
			} );
		} );

		describe( 'With filters', () => {
			it( 'Should return the correct path', () => {

				expect( urls.findABarrier( {} ) ).toEqual( '/find-a-barrier/' );
				expect( urls.findABarrier( { country: '1' } ) ).toEqual( '/find-a-barrier/?country=1' );
				expect( urls.findABarrier( { country: '1', sector: '2' } ) ).toEqual( '/find-a-barrier/?country=1&sector=2' );
				expect( urls.findABarrier( { search: 'a space separated term' } ) ).toEqual( `/find-a-barrier/?search=${ encodeURIComponent( 'a space separated term' )}` );
			} );
		} );
	} );

	describe( 'Watch List', () => {
		describe( 'save', () => {
			describe( 'Without any filters', () => {
				it( 'Should return the correct path', () => {

					expect( urls.watchList.save() ).toEqual( '/watch-list/save/' );
				} );
			} );

			describe( 'With filters', () => {
				it( 'Should return the correct path', () => {

					expect( urls.watchList.save( {} ) ).toEqual( '/watch-list/save/' );
					expect( urls.watchList.save( { country: '1' } ) ).toEqual( '/watch-list/save/?country=1' );
					expect( urls.watchList.save( { country: '1', sector: '2' } ) ).toEqual( '/watch-list/save/?country=1&sector=2' );
				} );
			} );
		});

		describe( 'rename', () => {
			it( 'Should return the correct path', () => {

				expect( urls.watchList.rename( 0 ) ).toEqual( '/watch-list/rename/0/' );
				expect( urls.watchList.rename( 1 ) ).toEqual( '/watch-list/rename/1/' );
			} );
		});

		describe( 'remove', () => {
			it( 'Should return the correct path', () => {

				expect( urls.watchList.remove( 0 ) ).toEqual( '/watch-list/remove/0/' );
				expect( urls.watchList.remove( 1 ) ).toEqual( '/watch-list/remove/1/' );
			} );
		});
	});

	describe( 'Documents', () => {
		describe( 'download', () => {
			it( 'Should return the correct path', () => {

				const documentId = uuid();

				expect( urls.documents.download( documentId ) ).toEqual( `/documents/${ documentId }/download/` );
			} );
		} );
	} );

	describe( 'Barier urls', () => {

		let barrierId;

		beforeEach( () => {

			barrierId = uuid();
		} );

		describe( 'Detail', () => {
			it( 'Should return the correct path', () => {

				expect( urls.barriers.detail( barrierId ) ).toEqual( `/barriers/${ barrierId }/` );
			} );
		} );

		describe( 'edit', () => {
			it( 'Should return the correct paths', () => {

				expect( urls.barriers.edit.product( barrierId ) ).toEqual( `/barriers/${ barrierId }/edit/product/` );
				expect( urls.barriers.edit.title( barrierId ) ).toEqual( `/barriers/${ barrierId }/edit/title/` );
				expect( urls.barriers.edit.description( barrierId ) ).toEqual( `/barriers/${ barrierId }/edit/description/` );
				expect( urls.barriers.edit.source( barrierId ) ).toEqual( `/barriers/${ barrierId }/edit/source/` );
				expect( urls.barriers.edit.priority( barrierId ) ).toEqual( `/barriers/${ barrierId }/edit/priority/` );
				expect( urls.barriers.edit.euExitRelated( barrierId ) ).toEqual( `/barriers/${ barrierId }/edit/eu-exit-related/` );
				expect( urls.barriers.edit.status( barrierId ) ).toEqual( `/barriers/${ barrierId }/edit/status/` );
				expect( urls.barriers.edit.problemStatus( barrierId ) ).toEqual( `/barriers/${ barrierId }/edit/problem-status/` );
			} );
		} );

		describe( 'Documents', () => {
			it( 'Should return the correct path', () => {

				const documentId = uuid();

				expect( urls.barriers.documents.add( barrierId ) ).toEqual( `/barriers/${ barrierId }/interactions/documents/add/` );
				expect( urls.barriers.documents.cancel( barrierId ) ).toEqual( `/barriers/${ barrierId }/interactions/documents/cancel/` );
				expect( urls.barriers.documents.delete( barrierId, documentId ) ).toEqual( `/barriers/${ barrierId }/interactions/documents/${ documentId }/delete/` );
			} );
		} );

		describe( 'Notes', () => {
			it( 'Should return the correct path', () => {

				const noteId = 23;

				expect( urls.barriers.notes.add( barrierId ) ).toEqual( `/barriers/${ barrierId }/interactions/add-note/` );
				expect( urls.barriers.notes.edit( barrierId, noteId ) ).toEqual( `/barriers/${ barrierId }/interactions/edit-note/${ noteId }/` );
				expect( urls.barriers.notes.delete( barrierId, noteId ) ).toEqual( `/barriers/${ barrierId }/interactions/delete-note/${ noteId }/` );
			} );

			describe( 'note documents', () => {
				it( 'Should return the correct path', () => {

					const noteId = 233;
					const documentId = uuid();

					expect( urls.barriers.notes.documents.add( barrierId, noteId ) ).toEqual( `/barriers/${ barrierId }/interactions/notes/${ noteId }/documents/add/` );
					expect( urls.barriers.notes.documents.cancel( barrierId, noteId ) ).toEqual( `/barriers/${ barrierId }/interactions/notes/${ noteId }/documents/cancel/` );
					expect( urls.barriers.notes.documents.delete( barrierId, noteId, documentId ) ).toEqual( `/barriers/${ barrierId }/interactions/notes/${ noteId }/documents/${ documentId }/delete/` );
				} );
			} );
		} );

		describe( 'status', () => {
			it( 'Should return the correct path', () => {

				expect( urls.barriers.status( barrierId ) ).toEqual( `/barriers/${ barrierId }/status/` );
			} );
		} );

		describe( 'types', () => {
			describe( 'edit', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.types.edit( barrierId ) ).toEqual( `/barriers/${ barrierId }/types/edit/` );
				} );
			} );

			describe( 'list', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.types.list( barrierId ) ).toEqual( `/barriers/${ barrierId }/types/` );
				} );
			} );

			describe( 'add', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.types.add( barrierId ) ).toEqual( `/barriers/${ barrierId }/types/add/` );
				} );
			} );

			describe( 'remove', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.types.remove( barrierId ) ).toEqual( `/barriers/${ barrierId }/types/remove/` );
				} );
			} );

			describe( 'new', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.types.new( barrierId ) ).toEqual( `/barriers/${ barrierId }/types/new/` );
				} );
			} );
		} );

		describe( 'location', () => {
			it( 'Should return the correct paths', () => {
				expect( urls.barriers.location.list( barrierId ) ).toEqual( `/barriers/${ barrierId }/location/` );
				expect( urls.barriers.location.edit( barrierId ) ).toEqual( `/barriers/${ barrierId }/location/edit/` );
				expect( urls.barriers.location.country( barrierId ) ).toEqual( `/barriers/${ barrierId }/location/country/` );
				expect( urls.barriers.location.adminAreas.add( barrierId ) ).toEqual( `/barriers/${ barrierId }/location/add-admin-area/` );
				expect( urls.barriers.location.adminAreas.remove( barrierId ) ).toEqual( `/barriers/${ barrierId }/location/remove-admin-area/` );
			});
		});

		describe( 'sectors', () => {
			it( 'Should return the correct paths', () => {
				expect( urls.barriers.sectors.list( barrierId ) ).toEqual( `/barriers/${ barrierId }/sectors/` );
				expect( urls.barriers.sectors.new( barrierId ) ).toEqual( `/barriers/${ barrierId }/sectors/new/` );
				expect( urls.barriers.sectors.edit( barrierId ) ).toEqual( `/barriers/${ barrierId }/sectors/edit/` );
				expect( urls.barriers.sectors.add( barrierId ) ).toEqual( `/barriers/${ barrierId }/sectors/add/` );
				expect( urls.barriers.sectors.remove( barrierId ) ).toEqual( `/barriers/${ barrierId }/sectors/remove/` );
				expect( urls.barriers.sectors.all.add( barrierId ) ).toEqual( `/barriers/${ barrierId }/sectors/add/all/` );
				expect( urls.barriers.sectors.all.remove( barrierId ) ).toEqual( `/barriers/${ barrierId }/sectors/remove/all/` );
			} );
		} );

		describe( 'companies', () => {
			it( 'Should return the correct path', () => {

				const companyId = uuid();

				expect( urls.barriers.companies.list( barrierId ) ).toEqual( `/barriers/${ barrierId }/companies/` );
				expect( urls.barriers.companies.new( barrierId ) ).toEqual( `/barriers/${ barrierId }/companies/new/` );
				expect( urls.barriers.companies.edit( barrierId ) ).toEqual( `/barriers/${ barrierId }/companies/edit/` );
				expect( urls.barriers.companies.search( barrierId ) ).toEqual( `/barriers/${ barrierId }/companies/search/` );
				expect( urls.barriers.companies.remove( barrierId ) ).toEqual( `/barriers/${ barrierId }/companies/remove/` );
				expect( urls.barriers.companies.details( barrierId, companyId ) ).toEqual( `/barriers/${ barrierId }/companies/${ companyId }/` );
			} );
		} );

		describe( 'team', () => {
			describe( 'list', () => {
				it( 'Should return the correct paths', () => {

					expect( urls.barriers.team.list( barrierId ) ).toEqual( `/barriers/${ barrierId }/team/` );
				});
			} );

			describe( 'add', () => {
				describe( 'Without a memberId', () => {
					it( 'Should return the correct paths', () => {

						expect( urls.barriers.team.add( barrierId ) ).toEqual( `/barriers/${ barrierId }/team/add/` );
					});
				} );

				describe( 'With a memberId', () => {
					it( 'Should return the correct paths', () => {

						const memberId = uuid();

						expect( urls.barriers.team.add( barrierId, memberId ) ).toEqual( `/barriers/${ barrierId }/team/add/?user=${ memberId }` );
					});
				} );
			} );

			describe( 'search', () => {
				it( 'Should return the correct paths', () => {

					expect( urls.barriers.team.search( barrierId ) ).toEqual( `/barriers/${ barrierId }/team/add/search/` );
				});
			} );
		} );

		describe( 'assessment', () => {
			it( 'Should return the correct paths', () => {

				expect( urls.barriers.assessment.detail( barrierId ) ).toEqual( `/barriers/${ barrierId }/assessment/` );
				expect( urls.barriers.assessment.economic.list( barrierId ) ).toEqual( `/barriers/${ barrierId }/assessment/economic/` );
				expect( urls.barriers.assessment.economic.new( barrierId ) ).toEqual( `/barriers/${ barrierId }/assessment/economic/new/` );
				expect( urls.barriers.assessment.economyValue( barrierId ) ).toEqual( `/barriers/${ barrierId }/assessment/economy-value/` );
				expect( urls.barriers.assessment.marketSize( barrierId ) ).toEqual( `/barriers/${ barrierId }/assessment/market-size/` );
				expect( urls.barriers.assessment.exportValue( barrierId ) ).toEqual( `/barriers/${ barrierId }/assessment/export-value/` );
				expect( urls.barriers.assessment.commercialValue( barrierId ) ).toEqual( `/barriers/${ barrierId }/assessment/commercial-value/` );

				const documentId = uuid();

				expect( urls.barriers.assessment.documents.add( barrierId ) ).toEqual( `/barriers/${ barrierId }/assessment/documents/add/` );
				expect( urls.barriers.assessment.documents.cancel( barrierId ) ).toEqual( `/barriers/${ barrierId }/assessment/documents/cancel/` );
				expect( urls.barriers.assessment.documents.delete( barrierId, documentId ) ).toEqual( `/barriers/${ barrierId }/assessment/documents/${ documentId }/delete/` );
			} );
		} );
	} );

	describe( 'Report urls', () => {

		let reportId;
		let countryId;

		beforeEach( () => {

			reportId = parseInt( ( Math.random() * 100 ) + 1, 10 ); // +1 to ensure we don't have 0 as a falsy value
		} );

		describe( 'index', () => {
			it( 'Should return the correct path', () => {

				expect( urls.reports.index() ).toEqual( '/reports/' );
			} );
		} );

		describe( 'new', () => {
			it( 'Should return the correct path', () => {

				expect( urls.reports.new() ).toEqual( '/reports/new/' );
			} );
		} );

		describe( 'start', () => {
			describe( 'With a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.reports.start( reportId ) ).toEqual( `/reports/${ reportId }/start/` );
				} );
			} );
			describe( 'Without a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.reports.start() ).toEqual( '/reports/new/start/' );
				} );
			} );
		} );

		describe( 'isResolved', () => {
			describe( 'With a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.reports.isResolved( reportId ) ).toEqual( `/reports/${ reportId }/is-resolved/` );
				} );
			} );
			describe( 'Without a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.reports.isResolved() ).toEqual( '/reports/new/is-resolved/' );
				} );
			} );
		} );

		describe( 'country', () => {
			describe( 'With a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.reports.country( reportId ) ).toEqual( `/reports/${ reportId }/country/` );
				} );
			} );
			describe( 'Without a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.reports.country() ).toEqual( '/reports/new/country/' );
				} );
			} );
		} );

		describe( 'hasAdminAreas', () => {

			beforeEach( () => {
				countryId = uuid();
			} );

			describe( 'With a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.reports.hasAdminAreas( reportId, countryId ) ).toEqual( `/reports/${ reportId }/country/${ countryId }/has-admin-areas/` );
				} );
			} );
			describe( 'Without a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.reports.hasAdminAreas( undefined, countryId ) ).toEqual( `/reports/new/country/${ countryId }/has-admin-areas/` );
				} );
			} );
		} );

		describe( 'adminAreas', () => {

			beforeEach( () => {
				countryId = uuid();
			} );

			describe( 'list', () => {
				describe( 'With a reportId', () => {
					it( 'Should return the correct path', () => {

						expect( urls.reports.adminAreas.list( reportId, countryId ) ).toEqual( `/reports/${ reportId }/country/${ countryId }/admin-areas/` );
					} );
				} );
				describe( 'Without a reportId', () => {
					it( 'Should return the correct path', () => {

						expect( urls.reports.adminAreas.list( undefined, countryId ) ).toEqual( `/reports/new/country/${ countryId }/admin-areas/` );
					} );
				} );
			} );

			describe( 'add', () => {
				describe( 'With a reportId', () => {
					it( 'Should return the correct path', () => {

						expect( urls.reports.adminAreas.add( reportId, countryId ) ).toEqual( `/reports/${ reportId }/country/${ countryId }/admin-areas/add/` );
					} );
				} );
				describe( 'Without a reportId', () => {

					it( 'Should return the correct path', () => {

						expect( urls.reports.adminAreas.add( undefined, countryId ) ).toEqual( `/reports/new/country/${ countryId }/admin-areas/add/` );
					} );
				} );
			} );

			describe( 'remove', () => {
				describe( 'With a reportId', () => {
					it( 'Should return the correct path', () => {

						expect( urls.reports.adminAreas.remove( reportId, countryId ) ).toEqual( `/reports/${ reportId }/country/${ countryId }/admin-areas/remove/` );
					} );
				} );
				describe( 'Without a reportId', () => {

					it( 'Should return the correct path', () => {

						expect( urls.reports.adminAreas.remove( undefined, countryId ) ).toEqual( `/reports/new/country/${ countryId }/admin-areas/remove/` );
					} );
				} );
			} );
		} );

		describe( 'When the reportId is required', () => {

			function getMethod( obj, name ){

				const index = name.indexOf( '.' );

				if( index >= 0 ){

					const newName = name.slice( 0, index );
					const newObj = obj[ newName ];

					return getMethod( newObj, name.slice( index + 1 ) );
				}

				return obj[ name ];
			}

			function checkUrls( urlsInfo ){

				for( let [ name, path ] of urlsInfo ){

					if( path && path.charAt( -1 ) !== '/' ){
						path += '/';
					}

					const method = getMethod( urls.reports, name );

					expect( method( reportId ) ).toEqual( `/reports/${ reportId }/${ path }` );
				}
			}

			it( 'Should return the correct path', () => {

				checkUrls( [
					[ 'detail', '' ],
					[ 'hasSectors', 'has-sectors' ],
					[ 'allSectors', 'all-sectors' ],
					[ 'sectors.list', 'sectors' ],
					[ 'sectors.add', 'sectors/add' ],
					[ 'sectors.remove', 'sectors/remove' ],
					[ 'sectors.all.add', 'sectors/add/all' ],
					[ 'sectors.all.remove', 'sectors/remove/all' ],
					[ 'aboutProblem', 'problem' ],
					[ 'summary', 'summary' ],
					[ 'submit', 'submit' ],
					[ 'delete', 'delete' ],
				] );
			} );
		} );
	} );

	describe( 'Report stage', () => {
		it( 'Should return the correct path for the current stage', () => {

			const report = {
				id: '6'
			};

			expect( urls.reportStage( '1.1', report ) ).toEqual( urls.reports.start( report.id ) );
			expect( urls.reportStage( '1.2', report ) ).toEqual( urls.reports.country( report.id ) );
			expect( urls.reportStage( '1.3', report ) ).toEqual( urls.reports.hasSectors( report.id ) );
			expect( urls.reportStage( '1.4', report ) ).toEqual( urls.reports.aboutProblem( report.id ) );
			expect( urls.reportStage( '1.5', report ) ).toEqual( urls.reports.summary( report.id ) );
			expect( urls.reportStage( 'blah', report ) ).toEqual( urls.reports.detail( report.id ) );
		} );
	} );
} );
