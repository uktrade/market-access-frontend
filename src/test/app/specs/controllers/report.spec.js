const proxyquire = require( 'proxyquire' );

const modulePath = '../../../../app/controllers/report';

describe( 'Report controller', () => {

	let controller;
	let req;
	let res;
	let datahub;
	let urls;

	beforeEach( () => {

		req = { query: {} };
		res = {
			render: jasmine.createSpy( 'res.render' ),
			redirect: jasmine.createSpy( 'res.redirect' )
		};
		datahub = {
			searchCompany: jasmine.createSpy( 'datahub.searchCompany' )
		};
		urls = {
			report: {
				company: jasmine.createSpy( 'urls.report.company' )
			}
		};

		controller = proxyquire( modulePath, {
			'../lib/datahub-service': datahub,
			'../lib/urls': urls
		} );
	} );

	describe( 'Index', () => {

		it( 'Should render the report page', () => {

			controller.index( req, res );

			expect( res.render ).toHaveBeenCalledWith( 'report/index' );
		} );
	} );

	describe( 'Start', () => {

		describe( 'When it is a POST', () => {

			it( 'Should redirect to the next step', () => {

				const companyUrl = 'my-url';

				req.method = 'POST';

				urls.report.company.and.callFake( () => companyUrl );

				controller.start( req, res );

				expect( res.redirect ).toHaveBeenCalledWith( companyUrl );
			} );
		} );

		describe( 'When it is a GET', () => {

			it( 'Should render the start page', () => {

				controller.start( req, res );

				expect( res.render ).toHaveBeenCalledWith( 'report/start' );
			} );
		} );

	} );

	describe( 'Company details', () => {

		it( 'SHould render the details page', () => {

			controller.companyDetails( req, res );

			expect( res.render ).toHaveBeenCalledWith( 'report/company-details' );
		} );
	} );

	describe( 'Company Search', () => {

		let next;
		const template = 'report/company-search';

		beforeEach( () => {

			next = jasmine.createSpy( 'next' );
		} );

		describe( 'Without a query', () => {

			it( 'Should render the search page', () => {

				controller.companySearch( req, res, next );

				expect( res.render ).toHaveBeenCalledWith( template, {} );
				expect( next ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'With a query', () => {

			const query = 'a search term';

			beforeEach( () => {

				req.query.q = query;
			} );

			describe( 'When there is not an error', () => {

				describe( 'When a company is found', () => {

					it( 'Should render the results', ( done ) => {

						const body = {	some: 'data' };

						const promise = new Promise( ( resolve ) => {

							resolve( { response: { isSuccess: true }, body } );
						} );

						datahub.searchCompany.and.callFake( () => promise );

						controller.companySearch( req, res, next );

						promise.then( () => {

							expect( res.render ).toHaveBeenCalledWith( template, { query, results: body } );
							done();
						} );
					} );
				} );

				describe( 'When a company is not found', () => {

					it( 'Should render an error message', ( done ) => {

						const promise = new Promise( ( resolve ) => {

							resolve( { response: { isSuccess: false, statusCode: 404 } } );
						} );

						datahub.searchCompany.and.callFake( () => promise );

						controller.companySearch( req, res, next );

						promise.then( () => {

							expect( res.render ).toHaveBeenCalledWith( template, { query, error: 'No company found' } );
							done();
						} );
					} );
				} );

				describe( 'When there is an error with the request', () => {

					it( 'Should render an error message', ( done ) => {

						const promise = new Promise( ( resolve ) => {

							resolve( { response: { isSuccess: false, statusCode: 400 } } );
						} );

						datahub.searchCompany.and.callFake( () => promise );

						controller.companySearch( req, res, next );

						promise.then( () => {

							expect( res.render ).toHaveBeenCalledWith( template, { query, error: 'There was an error finding the company' } );
							done();
						} );
					} );
				} );
			} );

			describe( 'When there is an error', () => {

				it( 'Should pass the error on', ( done ) => {

					const err = new Error( 'some error state' );

					const promise = new Promise( ( resolve, reject ) => {

						reject( err );
					} );

					datahub.searchCompany.and.callFake( () => promise );

					controller.companySearch( req, res, next );

					process.nextTick( () => {

						expect( next ).toHaveBeenCalledWith( err );
						done();
					} );
				} );
			} );
		} );
	} );
} );