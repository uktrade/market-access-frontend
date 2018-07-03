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

		describe( 'Next steps', () => {
			it( 'Should return the correct path', () => {

				const reportId = '5';

				expect( urls.report.nextSteps( reportId ) ).toEqual( `/report/${ reportId }/next-steps/` );
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
				expect( urls.reportStage( '1.5', report ) ).toEqual( urls.report.nextSteps( report.id ) );
				expect( urls.reportStage( 'blah', report ) ).toEqual( urls.report.detail( report.id ) );
			} );
		} );

		describe( 'Next report stage', () => {

			function createProgress( code ){

				return [
					{
						status_id: 1,
						stage_code: '1.0'
					},{
						status_id: 3,
						stage_code: code
					}
				];
			}

			describe( 'Without a matching stage', () => {
				describe( 'When the progress is not an array', () => {
					it( 'Should return the detail page', () => {

						const report = {
							id: '10',
							progress: ''
						};

						expect( urls.nextReportStage( report ) ).toEqual( urls.report.detail( report.id ) );
					} );
				} );

				describe( 'When the progress is an array without a matching status_id', () => {
					it( 'Should return the detail page', () => {

						const report = {
							id: '10',
							progress: [ { status_id: '100' } ]
						};

						expect( urls.nextReportStage( report ) ).toEqual( urls.report.detail( report.id ) );
					} );
				} );
			} );

			describe( 'default', () => {
				it( 'Should return the detail page', () => {

					const report = {
						id: '9',
						progress: createProgress( '11.0' )
					};

					expect( urls.nextReportStage( report ) ).toEqual( urls.report.detail( report.id ) );
				} );
			} );

			describe( 'For 1.3', () => {
				it( 'Should return the url for the next stage', () => {

					const report = {
						id: '7',
						progress: createProgress( '1.3' )
					};

					expect( urls.nextReportStage( report ) ).toEqual( urls.report.aboutProblem( report.id ) );
				} );
			} );

			describe( 'For 1.4', () => {
				it( 'Should return the url for the next stage', () => {

					const report = {
						id: '8',
						progress: createProgress( '1.4' )
					};

					expect( urls.nextReportStage( report ) ).toEqual( urls.report.nextSteps( report.id ) );
				} );
			} );
		} );
	} );
} );
