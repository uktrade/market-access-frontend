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
	} );
} );
