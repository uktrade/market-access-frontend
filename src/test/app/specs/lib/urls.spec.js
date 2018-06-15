const urls = require( '../../../../app/lib/urls' );

describe( 'URLs', () => {

	let barrierId;

	beforeEach( () => {

		barrierId = '12';
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

	describe( 'Report a barrier', () => {
		describe( 'index', () => {
			it( 'Should return the correct path', () => {

				expect( urls.report.index() ).toEqual( '/report/' );
			} );
		} );

		describe( 'start', () => {
			describe( 'With a barrierId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.report.start( barrierId ) ).toEqual( `/report/${ barrierId }/start/` );
				} );
			} );
			describe( 'Without a barrierId', () => {

				it( 'Should return the correct path', () => {

					expect( urls.report.start() ).toEqual( '/report/start/' );
				} );
			} );
		} );

		describe( 'Company Search', () => {
			describe( 'With a barrierId', () => {
				it( 'Should return the correct path', () => {

					const barrierId = 'abc-123';
					expect( urls.report.companySearch( barrierId ) ).toEqual( `/report/${ barrierId }/company/` );
				} );
			} );
			describe( 'Without a barrier id', () => {
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

			describe( 'Without a barrier id', () => {
				it( 'Should return the correct path', () => {

					expect( urls.report.companyDetails( companyId ) ).toEqual( `/report/company/${ companyId }/` );
				} );
			} );

			describe( 'With a barrier id', () => {
				it( 'Should return the correct path', () => {

					const barrierId = 'abc-123';
					expect( urls.report.companyDetails( companyId, barrierId ) ).toEqual( `/report/${ barrierId }/company/${ companyId }/` );
				} );
			} );
		} );

		describe( 'Company contacts', () => {

			let companyId;

			beforeEach( () => {

				companyId = 'abc-124';
			} );

			describe( 'With a barrierId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.report.contacts( companyId, barrierId ) ).toEqual( `/report/${ barrierId }/company/${ companyId }/contacts/` );
				} );
			} );
			describe( 'Without a barrierId', () => {

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

			describe( 'With a barrierId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.report.viewContact( contactId, barrierId ) ).toEqual( `/report/${ barrierId }/contact/${ contactId }/` );
				} );
			} );
			describe( 'Without a barrierId', () => {

				it( 'Should return the correct path', () => {

					expect( urls.report.viewContact( contactId ) ).toEqual( `/report/contact/${ contactId }/` );
				} );
			} );
		} );

		describe( 'Save', () => {
			describe( 'With a barrierId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.report.save( barrierId ) ).toEqual( `/report/${ barrierId }/save/` );
				} );
			} );
			describe( 'Without a barrierId', () => {
				it( 'Should return the correct path', () => {

					expect( urls.report.save() ).toEqual( '/report/save/' );
				} );
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
