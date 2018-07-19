const urls = require( './urls' );

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

		describe( 'Company Search', () => {
			describe( 'With a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.reports.companySearch( reportId ) ).toEqual( `/reports/${ reportId }/company/` );
				} );
			} );
			describe( 'Without a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.reports.companySearch() ).toEqual( '/reports/new/company/' );
				} );
			} );
		} );

		describe( 'Company Details', () => {

			let companyId;

			beforeEach( () => {

				companyId = 'abc-1234';
			} );

			describe( 'Without a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.reports.companyDetails( companyId ) ).toEqual( `/reports/new/company/${ companyId }/` );
				} );
			} );

			describe( 'With a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.reports.companyDetails( companyId, reportId ) ).toEqual( `/reports/${ reportId }/company/${ companyId }/` );
				} );
			} );
		} );

		describe( 'Company contacts', () => {

			let companyId;

			beforeEach( () => {

				companyId = 'abc-124';
			} );

			describe( 'With a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.reports.contacts( companyId, reportId ) ).toEqual( `/reports/${ reportId }/company/${ companyId }/contacts/` );
				} );
			} );
			describe( 'Without a reportId', () => {

				it( 'Should return the correct path', () => {

					expect( urls.reports.contacts( companyId ) ).toEqual( `/reports/new/company/${ companyId }/contacts/` );
				} );
			} );
		} );

		describe( 'View contact', () => {

			let contactId;

			beforeEach( () => {

				contactId = 'xyz-789';
			} );

			describe( 'With a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.reports.viewContact( contactId, reportId ) ).toEqual( `/reports/${ reportId }/contact/${ contactId }/` );
				} );
			} );
			describe( 'Without a reportId', () => {

				it( 'Should return the correct path', () => {

					expect( urls.reports.viewContact( contactId ) ).toEqual( `/reports/new/contact/${ contactId }/` );
				} );
			} );
		} );

		describe( 'Save', () => {
			describe( 'With a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.reports.save( reportId ) ).toEqual( `/reports/${ reportId }/save/` );
				} );
			} );
			describe( 'Without a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.reports.save() ).toEqual( '/reports/new/save/' );
				} );
			} );
		} );

		describe( 'When the reportId is required', () => {

			function checkUrls( urlsInfo ){

				for( let [ name, path ] of urlsInfo ){

					expect( urls.reports[ name ]( reportId ) ).toEqual( `/reports/${ reportId }/${ path }/` );
				}
			}

			it( 'Should return the correct path', () => {

				checkUrls( [
					[ 'aboutProblem', 'problem' ],
					[ 'impact', 'impact' ],
					[ 'legal', 'legal' ],
					[ 'type', 'type' ],
					[ 'support', 'support' ],
					[ 'nextSteps', 'next-steps' ],
					[ 'submit', 'submit' ]
				] );
			} );
		} );

		describe( 'success', () => {
			it( 'Should return the correct path', () => {

				expect( urls.reports.success() ).toEqual( '/reports/new/success/' );
			} );
		} );
	} );

	describe( 'Report stage', () => {
		it( 'Should return the correct path for the current stage', () => {

			const report = {
				id: '6',
				company_id: 'abc-123',
				contact_id: 'def-456'
			};

			expect( urls.reportStage( '1.1', report ) ).toEqual( urls.reports.start( report.id ) );
			expect( urls.reportStage( '1.2', report ) ).toEqual( urls.reports.companyDetails( report.company_id, report.id ) );
			expect( urls.reportStage( '1.3', report ) ).toEqual( urls.reports.viewContact( report.contact_id, report.id ) );
			expect( urls.reportStage( '1.4', report ) ).toEqual( urls.reports.aboutProblem( report.id ) );
			expect( urls.reportStage( '1.5', report ) ).toEqual( urls.reports.impact( report.id ) );
			expect( urls.reportStage( '1.6', report ) ).toEqual( urls.reports.legal( report.id ) );
			expect( urls.reportStage( '1.7', report ) ).toEqual( urls.reports.type( report.id ) );
			expect( urls.reportStage( '2.1', report ) ).toEqual( urls.reports.support( report.id ) );
			expect( urls.reportStage( '2.2', report ) ).toEqual( urls.reports.nextSteps( report.id ) );
			expect( urls.reportStage( 'blah', report ) ).toEqual( urls.reports.detail( report.id ) );
		} );
	} );
} );
