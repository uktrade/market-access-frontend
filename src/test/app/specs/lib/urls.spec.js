const urls = require( '../../../../app/lib/urls' );

describe( 'URLs', () => {
	describe( 'Login', () => {
		it( 'Should return the login path', () => {

			expect( urls.login() ).toEqual( '/login/' );
		} );
	} );

	describe( 'Index', () => {
		it( 'Should return the correct path', () => {

			expect( urls.index() ).toEqual( '/' );
		} );
	} );

	describe( 'Report a barrier', () => {
		describe( 'index', () => {
			it( 'Should return the correct path', () => {

				expect( urls.report.index() ).toEqual( '/report/' );
			} );
		} );

		describe( 'start', () => {
			it( 'Should return the correct path', () => {

				expect( urls.report.start() ).toEqual( '/report/start/' );
			} );
		} );

		describe( 'company', () => {
			describe( 'Without a company id', () => {
				it( 'Should return the correct path', () => {

					expect( urls.report.company() ).toEqual( '/report/company/' );
				} );
			} );

			describe( 'With a company id', () => {
				it( 'Should return the correct path', () => {

					const id = 'abc-123';
					expect( urls.report.company( id ) ).toEqual( `/report/company/${ id }/` );
				} );
			} );
		} );

		describe( 'Save new', () => {
			it( 'Should return the correct path', () => {

				expect( urls.report.saveNew() ).toEqual( '/report/new/' );
			} );
		} );

		describe( 'Company contacts', () => {
			it( 'Should return the correct path', () => {

				const barrierId = '1';
				const companyId = 'abc-124';

				expect( urls.report.contacts( barrierId, companyId ) ).toEqual( `/report/${ barrierId }/company/${ companyId }/contacts/` );
			} );
		} );

		describe( 'View contact', () => {
			it( 'Should return the correct path', () => {

				const barrierId = '2';
				const contactId = 'xyz-789';

				expect( urls.report.viewContact( barrierId, contactId ) ).toEqual( `/report/${ barrierId }/contact/${ contactId }/` );
			} );
		} );

		describe( 'Save contact', () => {
			it( 'Should return the correct path', () => {

				const barrierId = '3';

				expect( urls.report.saveContact( barrierId ) ).toEqual( `/report/${ barrierId }/save/contact/` );
			} );
		} );

		describe( 'About problem', () => {
			it( 'Should return the correct path', () => {

				const barrierId = '4';

				expect( urls.report.aboutProblem( barrierId ) ).toEqual( `/report/${ barrierId }/problem/` );
			} );
		} );
	} );
} );
