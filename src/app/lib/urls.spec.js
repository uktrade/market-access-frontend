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

			reportId = parseInt( Math.random() * 100, 10 );
		} );

		describe( 'index', () => {
			it( 'Should return the correct path', () => {

				expect( urls.report.index() ).toEqual( '/report/' );
			} );
		} );

		describe( 'start', () => {
			describe( 'With a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.report.start( reportId ) ).toEqual( `/report/${ reportId }/start/` );
				} );
			} );
			describe( 'Without a reportId', () => {

				it( 'Should return the correct path', () => {

					expect( urls.report.start() ).toEqual( '/report/start/' );
				} );
			} );
		} );

		describe( 'Company Search', () => {
			describe( 'With a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.report.companySearch( reportId ) ).toEqual( `/report/${ reportId }/company/` );
				} );
			} );
			describe( 'Without a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.report.companySearch() ).toEqual( '/report/company/' );
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

					expect( urls.report.companyDetails( companyId ) ).toEqual( `/report/company/${ companyId }/` );
				} );
			} );

			describe( 'With a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.report.companyDetails( companyId, reportId ) ).toEqual( `/report/${ reportId }/company/${ companyId }/` );
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

					expect( urls.report.contacts( companyId, reportId ) ).toEqual( `/report/${ reportId }/company/${ companyId }/contacts/` );
				} );
			} );
			describe( 'Without a reportId', () => {

				it( 'Should return the correct path', () => {

					expect( urls.report.contacts( companyId ) ).toEqual( `/report/company/${ companyId }/contacts/` );
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

					expect( urls.report.viewContact( contactId, reportId ) ).toEqual( `/report/${ reportId }/contact/${ contactId }/` );
				} );
			} );
			describe( 'Without a reportId', () => {

				it( 'Should return the correct path', () => {

					expect( urls.report.viewContact( contactId ) ).toEqual( `/report/contact/${ contactId }/` );
				} );
			} );
		} );

		describe( 'Save', () => {
			describe( 'With a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.report.save( reportId ) ).toEqual( `/report/${ reportId }/save/` );
				} );
			} );
			describe( 'Without a reportId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.report.save() ).toEqual( '/report/save/' );
				} );
			} );
		} );

		describe( 'When the reportId is required', () => {

			function checkUrls( urlsInfo ){

				for( let [ name, path ] of urlsInfo ){

					expect( urls.report[ name ]( reportId ) ).toEqual( `/report/${ reportId }/${ path }/` );
				}
			}

			it( 'Should return the correct path', () => {

				checkUrls( [
					[ 'aboutProblem', 'problem' ],
					[ 'impact', 'impact' ],
					[ 'legal', 'legal' ],
					[ 'type', 'type' ],
					[ 'support', 'support' ],
					[ 'nextSteps', 'next-steps' ]
				] );
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

			expect( urls.reportStage( '1.1', report ) ).toEqual( urls.report.start( report.id ) );
			expect( urls.reportStage( '1.2', report ) ).toEqual( urls.report.companyDetails( report.company_id, report.id ) );
			expect( urls.reportStage( '1.3', report ) ).toEqual( urls.report.viewContact( report.contact_id, report.id ) );
			expect( urls.reportStage( '1.4', report ) ).toEqual( urls.report.aboutProblem( report.id ) );
			expect( urls.reportStage( '1.5', report ) ).toEqual( urls.report.impact( report.id ) );
			expect( urls.reportStage( '1.6', report ) ).toEqual( urls.report.legal( report.id ) );
			expect( urls.reportStage( '1.7', report ) ).toEqual( urls.report.type( report.id ) );
			expect( urls.reportStage( '2.1', report ) ).toEqual( urls.report.support( report.id ) );
			expect( urls.reportStage( '2.2', report ) ).toEqual( urls.report.nextSteps( report.id ) );
			expect( urls.reportStage( 'blah', report ) ).toEqual( urls.report.detail( report.id ) );
		} );
	} );
} );
