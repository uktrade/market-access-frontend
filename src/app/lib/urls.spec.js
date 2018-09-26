const urls = require( './urls' );
const uuid = require( 'uuid/v4' );

describe( 'URLs', () => {

	describe( 'Index', () => {
		it( 'Should return the correct path', () => {

			expect( urls.index() ).toEqual( '/' );
		} );
	} );

	describe( 'Login', () => {
		it( 'Should return the login path', () => {

			expect( urls.login() ).toEqual( '/login/' );
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

		describe( 'Interactions', () => {
			it( 'Should return the correct path', () => {

				expect( urls.barriers.interactions( barrierId ) ).toEqual( `/barriers/${ barrierId }/interactions/` );
			} );
		} );

		describe( 'Add note', () => {
			it( 'Should return the correct path', () => {

				expect( urls.barriers.addNote( barrierId ) ).toEqual( `/barriers/${ barrierId }/interactions/add-note/` );
			} );
		} );

		describe( 'status', () => {
			it( 'Should return the correct path', () => {

				expect( urls.barriers.status( barrierId ) ).toEqual( `/barriers/${ barrierId }/status/` );
			} );
		} );

		describe( 'statusResolved', () => {
			it( 'Should return the correct path', () => {

				expect( urls.barriers.statusResolved( barrierId ) ).toEqual( `/barriers/${ barrierId }/status/resolved/` );
			} );
		} );

		describe( 'statusHibernated', () => {
			it( 'Should return the correct path', () => {

				expect( urls.barriers.statusHibernated( barrierId ) ).toEqual( `/barriers/${ barrierId }/status/hibernated/` );
			} );
		} );

		describe( 'statusOpen', () => {
			it( 'Should return the correct path', () => {

				expect( urls.barriers.statusOpen( barrierId ) ).toEqual( `/barriers/${ barrierId }/status/open/` );
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
					[ 'success', 'success' ]
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
