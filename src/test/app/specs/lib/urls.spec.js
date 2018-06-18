const urls = require( '../../../../app/lib/urls' );

describe( 'URLs', () => {

	let reportId;

	beforeEach( () => {

		reportId = '12';
	} );

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

	describe( 'Report a report', () => {
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

					const reportId = 'abc-123';
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

					const reportId = 'abc-123';
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

		describe( 'About problem', () => {
			it( 'Should return the correct path', () => {

				const reportId = '4';

				expect( urls.report.aboutProblem( reportId ) ).toEqual( `/report/${ reportId }/problem/` );
			} );
		} );
	} );
} );
