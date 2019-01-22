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
		it( 'Should return the login path', () => {

			expect( urls.findABarrier() ).toEqual( '/find-a-barrier/' );
		} );
	} );

	describe( 'Documents', () => {
		describe( 'download', () => {
			it( 'Should return the correct path', () => {

				const documentId = uuid();
				expect( urls.documents.download( documentId ) ).toEqual( `/documents/${ documentId }/download/` );
			} );
		} );

		describe( 'getScanStatus', () => {
			it( 'Should return the correct path', () => {

				const documentId = uuid();
				expect( urls.documents.getScanStatus( documentId ) ).toEqual( `/documents/${ documentId }/status/` );
			} );
		} );

		describe( 'delete', () => {
			it( 'Should return the correct path', () => {

				const documentId = uuid();
				expect( urls.documents.delete( documentId ) ).toEqual( `/documents/${ documentId }/delete/` );
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
			describe( 'headlines', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.edit.headlines( barrierId ) ).toEqual( `/barriers/${ barrierId }/edit/` );
				} );
			} );

			describe( 'product', () => {
				it( 'Should return the correct path', () => {

					expect( urls.barriers.edit.product( barrierId ) ).toEqual( `/barriers/${ barrierId }/edit/product/` );
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
		} );

		describe( 'Interactions', () => {
			it( 'Should return the correct path', () => {

				expect( urls.barriers.interactions( barrierId ) ).toEqual( `/barriers/${ barrierId }/interactions/` );
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
						expect( urls.barriers.notes.documents.add( barrierId ) ).toEqual( `/barriers/${ barrierId }/interactions/documents/add/` );
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
					[ 'sectors', 'sectors' ],
					[ 'addSector', 'sectors/add' ],
					[ 'removeSector', 'sectors/remove' ],
					[ 'aboutProblem', 'problem' ],
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
			expect( urls.reportStage( 'blah', report ) ).toEqual( urls.reports.detail( report.id ) );
		} );
	} );
} );
