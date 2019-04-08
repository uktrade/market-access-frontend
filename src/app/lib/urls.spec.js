const urls = require( './urls' );
const uuid = require( 'uuid/v4' );

describe( 'URLs', () => {

	describe( 'Index', () => {
		it( 'Should return the correct path', () => {

			expect( urls.index() ).toEqual( '/' );
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
		it( 'Should return the login path', () => {

			expect( urls.whatIsABarrier() ).toEqual( '/what-is-a-barrier/' );
		} );
	} );

	describe( 'Find a barrier', () => {
		describe( 'Without any filters', () => {
			it( 'Should return the login path', () => {

				expect( urls.findABarrier() ).toEqual( '/find-a-barrier/' );
			} );
		} );

		describe( 'With filters', () => {
			it( 'Should return the login path', () => {

				expect( urls.findABarrier( {} ) ).toEqual( '/find-a-barrier/' );
				expect( urls.findABarrier( { country: '1' } ) ).toEqual( '/find-a-barrier/?country=1' );
				expect( urls.findABarrier( { country: '1', sector: '2' } ) ).toEqual( '/find-a-barrier/?country=1&sector=2' );
			} );
		} );
	} );

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

			describe( 'product', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.edit.product( barrierId ) ).toEqual( `/barriers/${ barrierId }/edit/product/` );
				} );
			} );

			describe( 'title', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.edit.title( barrierId ) ).toEqual( `/barriers/${ barrierId }/edit/title/` );
				} );
			} );

			describe( 'description', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.edit.description( barrierId ) ).toEqual( `/barriers/${ barrierId }/edit/description/` );
				} );
			} );

			describe( 'source', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.edit.source( barrierId ) ).toEqual( `/barriers/${ barrierId }/edit/source/` );
				} );
			} );

			describe( 'priority', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.edit.priority( barrierId ) ).toEqual( `/barriers/${ barrierId }/edit/priority/` );
				} );
			} );

			describe( 'eu exit related', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.edit.euExitRelated( barrierId ) ).toEqual( `/barriers/${ barrierId }/edit/eu-exit-related/` );
				});
			});
			describe( 'status', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.edit.status( barrierId ) ).toEqual( `/barriers/${ barrierId }/edit/status/` );
				} );
			} );
		} );

		describe( 'Documents', () => {
			describe( 'add', () => {
				it( 'Should return the correct path', () => {

					const barrierId = uuid();
					expect( urls.barriers.documents.add( barrierId ) ).toEqual( `/barriers/${ barrierId }/interactions/documents/add/` );
				} );
			} );

			describe( 'cancel', () => {
				it( 'Should return the correct path', () => {

					const barrierId = uuid();
					expect( urls.barriers.documents.cancel( barrierId ) ).toEqual( `/barriers/${ barrierId }/interactions/documents/cancel/` );
				} );
			} );

			describe( 'delete', () => {
				it( 'Should return the correct path', () => {

					const barrierId = uuid();
					const documentId = uuid();

					expect( urls.barriers.documents.delete( barrierId, documentId ) ).toEqual( `/barriers/${ barrierId }/interactions/documents/${ documentId }/delete/` );
				} );
			} );
		} );

		describe( 'Notes', () => {
			describe( 'Add note', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.notes.add( barrierId ) ).toEqual( `/barriers/${ barrierId }/interactions/add-note/` );
				} );
			} );

			describe( 'Edit note', () => {
				it( 'Should return the correct path', () => {

					const noteId = 23;
					expect( urls.barriers.notes.edit( barrierId, noteId ) ).toEqual( `/barriers/${ barrierId }/interactions/edit-note/${ noteId }/` );
				} );
			} );

			describe( 'note documents', () => {
				describe( 'add', () => {
					it( 'Should return the correct path', () => {

						const barrierId = uuid();
						const noteId = 233;
						expect( urls.barriers.notes.documents.add( barrierId, noteId ) ).toEqual( `/barriers/${ barrierId }/interactions/notes/${ noteId }/documents/add/` );
					} );
				} );

				describe( 'cancel', () => {
					it( 'Should return the correct path', () => {

						const barrierId = uuid();
						const noteId = 233;
						expect( urls.barriers.notes.documents.cancel( barrierId, noteId ) ).toEqual( `/barriers/${ barrierId }/interactions/notes/${ noteId }/documents/cancel/` );
					} );
				} );

				describe( 'delete', () => {
					it( 'Should return the correct path', () => {

						const barrierId = uuid();
						const noteId = 234;
						const documentId = uuid();

						expect( urls.barriers.notes.documents.delete( barrierId, noteId, documentId ) ).toEqual( `/barriers/${ barrierId }/interactions/notes/${ noteId }/documents/${ documentId }/delete/` );
					} );
				} );
			} );
		} );

		describe( 'status', () => {
			it( 'Should return the correct path', () => {

				expect( urls.barriers.status( barrierId ) ).toEqual( `/barriers/${ barrierId }/status/` );
			} );
		} );

		describe( 'type', () => {
			describe( 'category', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.type.category( barrierId ) ).toEqual( `/barriers/${ barrierId }/type/` );
				} );
			} );
			describe( 'list', () => {
				it( 'Should return the correct path', () => {

					const category = 'abc';

					expect( urls.barriers.type.list( barrierId, category ) ).toEqual( `/barriers/${ barrierId }/type/${ category }/` );
				} );
			} );
		} );

		describe( 'location', () => {
			describe( 'list', () => {
				it( 'Should return the correct path', () => {
					expect( urls.barriers.location.list( barrierId ) ).toEqual( `/barriers/${ barrierId }/location/` );
				} );
			});
			describe( 'edit', () => {
				it( 'Should return the correct path', () => {
					expect( urls.barriers.location.edit( barrierId ) ).toEqual( `/barriers/${ barrierId }/location/edit` );
				} );
			});
			describe( 'country', () => {
				it( 'Should return the correct path', () => {
					expect( urls.barriers.location.country( barrierId ) ).toEqual( `/barriers/${ barrierId }/location/country` );
				} );
			});
		});

		describe( 'sectors', () => {
			describe( 'edit', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.sectors.edit( barrierId ) ).toEqual( `/barriers/${ barrierId }/sectors/edit/` );
				} );
			} );

			describe( 'list', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.sectors.list( barrierId ) ).toEqual( `/barriers/${ barrierId }/sectors/` );
				} );
			} );

			describe( 'add', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.sectors.add( barrierId ) ).toEqual( `/barriers/${ barrierId }/sectors/add/` );
				} );
			} );

			describe( 'remove', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.sectors.remove( barrierId ) ).toEqual( `/barriers/${ barrierId }/sectors/remove/` );
				} );
			} );

			describe( 'new', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.sectors.new( barrierId ) ).toEqual( `/barriers/${ barrierId }/sectors/new/` );
				} );
			} );
		} );

		describe( 'companies', () => {
			describe( 'edit', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.companies.edit( barrierId ) ).toEqual( `/barriers/${ barrierId }/companies/edit/` );
				} );
			} );

			describe( 'list', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.companies.list( barrierId ) ).toEqual( `/barriers/${ barrierId }/companies/` );
				} );
			} );

			describe( 'search', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.companies.search( barrierId ) ).toEqual( `/barriers/${ barrierId }/companies/search/` );
				} );
			} );

			describe( 'remove', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.companies.remove( barrierId ) ).toEqual( `/barriers/${ barrierId }/companies/remove/` );
				} );
			} );

			describe( 'details', () => {
				it( 'Should return the correct path', () => {

					const companyId = uuid();

					expect( urls.barriers.companies.details( barrierId, companyId ) ).toEqual( `/barriers/${ barrierId }/companies/${ companyId }/` );
				} );
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

					expect( urls.reports.hasAdminAreas(undefined, countryId) ).toEqual( `/reports/new/country/${ countryId }/has-admin-areas/` );
				} );
			} );
		} );

		describe( 'adminAreas', () => {

			beforeEach( () => {
				countryId = uuid();
			} );

			describe( 'With a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.reports.adminAreas( reportId, countryId ) ).toEqual( `/reports/${ reportId }/country/${ countryId }/admin-areas/` );
				} );
			} );
			describe( 'Without a reportId', () => {

				it( 'Should return the correct path', () => {

					expect( urls.reports.adminAreas( undefined, countryId) ).toEqual( `/reports/new/country/${ countryId }/admin-areas/` );
				} );
			} );
		} );
		
		describe( 'addAdminArea', () => {

			beforeEach( () => {
				countryId = uuid();
			} );

			describe( 'With a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.reports.addAdminArea( reportId, countryId ) ).toEqual( `/reports/${ reportId }/country/${ countryId }/admin-areas/add/` );
				} );
			} );
			describe( 'Without a reportId', () => {

				it( 'Should return the correct path', () => {

					expect( urls.reports.addAdminArea( undefined, countryId) ).toEqual( `/reports/new/country/${ countryId }/admin-areas/add/` );
				} );
			} );
		} );

		describe( 'removeAdminArea', () => {

			beforeEach( () => {
				countryId = uuid();
			} );

			describe( 'With a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.reports.removeAdminArea( reportId, countryId ) ).toEqual( `/reports/${ reportId }/country/${ countryId }/admin-areas/remove/` );
				} );
			} );
			describe( 'Without a reportId', () => {

				it( 'Should return the correct path', () => {

					expect( urls.reports.removeAdminArea(undefined, countryId) ).toEqual( `/reports/new/country/${ countryId }/admin-areas/remove/` );
				} );
			} );
		} );

		describe( 'When the reportId is required', () => {

			function checkUrls( urlsInfo ){

				for( let [ name, path ] of urlsInfo ){

					if( path && path.charAt( -1 ) !== '/' ){
						path += '/';
					}

					expect( urls.reports[ name ]( reportId ) ).toEqual( `/reports/${ reportId }/${ path }` );
				}
			}

			it( 'Should return the correct path', () => {

				checkUrls( [
					[ 'detail', '' ],
					[ 'hasSectors', 'has-sectors' ],
					[ 'allSectors', 'all-sectors' ],
					[ 'sectors', 'sectors' ],
					[ 'addSector', 'sectors/add' ],
					[ 'removeSector', 'sectors/remove' ],
					[ 'aboutProblem', 'problem' ],
					[ 'summary', 'summary' ],
					[ 'submit', 'submit' ],
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
