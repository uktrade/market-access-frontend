const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

const modulePath = './admin-areas';

describe( 'Report controllers', () => {

	let controller;
	let req;
	let res;
	let next;
	let csrfToken;
	let Form;
	let form;
	let urls;
	let metadata;
	let backend;
	let validators;
	let getValuesResponse;
	let getTemplateValuesResponse;

	beforeEach( () => {

		( { req, res, next, csrfToken } = jasmine.helpers.mocks.middleware() );

		getValuesResponse = { a: 1, b: 2 };
		getTemplateValuesResponse = { c: 3, d: 4 };
		form = {
			hasErrors: jasmine.createSpy( 'form.hasErrors' ),
			validate: jasmine.createSpy( 'form.validate' ),
			getValues: jasmine.createSpy( 'form.getValues' ).and.callFake( () => getValuesResponse ),
			getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.callFake( () => getTemplateValuesResponse )
		};

		validators = {
			isMetadata: jasmine.createSpy( 'validators.isMetaData' ),
		};

		metadata = {
			getSector: jasmine.createSpy( 'metadata.getAdminArea' ),
			getAdminAreaList: () => [
				{
					value: 'id-1',
					text: 'one'
				},{
					value: 'id-2',
					text: 'two'
				},{
					value: 'id-3',
					text: 'three'
				}
			],
		};

		backend = {
			reports: {
				save: jasmine.createSpy( 'backend.reports.save' ),
				update: jasmine.createSpy( 'backend.reports.update' )
			}
		};

		urls = {
			reports: {
				hasSectors: jasmine.createSpy( 'urls.reports.hasSectors' ),
				adminAreas: jasmine.createSpy( 'urls.reports.adminAreas' ),
			},
		};

		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );

		controller = proxyquire( modulePath, {
			'../../../lib/metadata': metadata,
			'../../../lib/backend-service': backend,
			'../../../lib/Form': Form,
			'../../../lib/urls': urls,
			'../../../lib/validators': validators,
		} );
	} );

	describe( 'Sectors', () => {
		describe( 'List', () => {
			const template = 'reports/views/sectors';

		beforeEach( () => {

			req.report = {};
		} );

		function checkRender( sectors ){

			expect( res.render ).toHaveBeenCalledWith( template, { sectors: sectors.map( metadata.getSector ), csrfToken } );
		}

		describe( 'a GET', () => {
			describe( 'With sectors in the session', () => {
				it( 'Should render the page with the sectors', async () => {

					const sectors = [ uuid(), uuid(), uuid() ];

					req.session.sectors = sectors;

					await controller.list( req, res, next );

					checkRender( sectors );
				} );
			} );

			describe( 'With sectors on the report', () => {
				it( 'Should render the page with the sectors', async () => {

					const sectors = [ uuid(), uuid(), uuid() ];

					req.report.sectors = sectors;

					await controller.list( req, res, next );

					checkRender( sectors );
				} );
			} );

			describe( 'With no sectors', () => {
				it( 'Should render the page with and empty list', async () => {

					await controller.list( req, res, next );

					checkRender( [] );
				} );
			} );
		} );

		describe( 'a POST', () => {

			beforeEach( () => {

				req.method = 'POST';
				req.body = {};
			} );

			describe( 'With no sectors', () => {
				it( 'Should render the page', async () => {

					await controller.list( req, res, next );

					checkRender( [] );
				} );
			} );

			describe( 'With an empty list of sectors', () => {
				it( 'Should render the page', async () => {

					await controller.list( req, res, next );

					checkRender( [] );
				} );
			} );

			describe( 'With sectors', () => {

				beforeEach( () => {

					req.session.sectors = [ uuid(), uuid() ];
				} );

				describe( 'When the service throws an error', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'boom' );
						backend.reports.saveSectors.and.callFake( () => { throw err; } );

						await controller.list( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
						expect( res.render ).not.toHaveBeenCalled();
						expect( req.session.sectors ).not.toBeDefined();
					} );
				} );

				describe( 'When the service response is not a success', () => {
					it( 'Should call next with an error', async () => {

						const statusCode = 500;
						const err = new Error( `Unable to update report, got ${ statusCode } response code` );

						backend.reports.saveSectors.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode } } ) );

						await controller.list( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
						expect( res.render ).not.toHaveBeenCalled();
						expect( req.session.sectors ).not.toBeDefined();
					} );
				} );

				describe( 'When the service response is success', () => {

					beforeEach( () => {

						backend.reports.saveSectors.and.callFake( () => ({ response: { isSuccess: true } }) );
						req.report.id = uuid();
					} );

					describe( 'When it is an exit', () => {
						it( 'Should redirect to the detail page', async () => {

							const detailResponse = '/a/detail/';

							urls.reports.detail.and.callFake( () => detailResponse );
							req.body = { action: 'exit' };

							await controller.list( req, res, next );

							expect( next ).not.toHaveBeenCalled();
							expect( res.render ).not.toHaveBeenCalled();
							expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
							expect( urls.reports.detail ).toHaveBeenCalledWith( req.report.id );
						} );
					} );

					describe( 'When it is NOT an exit', () => {
						it( 'Should redirect to the aboutProblem page', async () => {

							const aboutResponse = '/about/report/';

							urls.reports.aboutProblem.and.callFake( () => aboutResponse );

							await controller.list( req, res, next );

							expect( next ).not.toHaveBeenCalled();
							expect( res.render ).not.toHaveBeenCalled();
							expect( res.redirect ).toHaveBeenCalledWith( aboutResponse );
							expect( urls.reports.aboutProblem ).toHaveBeenCalledWith( req.report.id );
						} );
					} );
				} );
			} );
		} );
		} );
		describe( 'Remove', () => {
			it( 'Should remove the sector in the session list and redirect', () => {

				const sector = uuid();
				const sectors = [ uuid(), uuid(), sector ];
				const expected = sectors.slice( 0, 2 );
				const sectorsResponse = '/to/sectors';
				const reportId = '123';

				urls.reports.sectors.and.callFake( () => sectorsResponse );
				req.session.sectors = sectors;
				req.body = { sector };
				req.report = { id: reportId };

				controller.remove( req, res );

				expect( req.session.sectors ).toEqual( expected );
				expect( res.redirect ).toHaveBeenCalledWith( sectorsResponse );
				expect( urls.reports.sectors ).toHaveBeenCalledWith( reportId );
			} );
		} );
		describe( 'Add', () => {

			let report;
			const template = 'reports/views/add-sector';

			beforeEach( () => {

				report = {
					id: uuid(),
					sectors: null,
				};
				req.report = report;
			} );

			function checkRender( sectors ){

				const expected = Object.assign( {}, getTemplateValuesResponse, { currentSectors: sectors.map( metadata.getSector ) } );

				controller.add( req, res );

				expect( res.render ).toHaveBeenCalledWith( template, expected );
			}

			function createSectors(){
				return [ uuid(), uuid(), uuid() ];
			}

			describe( 'a GET', () => {
				describe( 'Form config', () => {
					describe( 'When there are not an sectors in the session', () => {
						it( 'Should setup the form correctly with default values', async () => {

							await controller.add( req, res, next );

							const args = Form.calls.argsFor( 0 );
							const config = args[ 1 ];

							expect( Form ).toHaveBeenCalled();
							expect( args[ 0 ] ).toEqual( req );

							expect( config.sectors ).toBeDefined();
							expect( config.sectors.type ).toEqual( Form.SELECT );
							expect( config.sectors.items ).toEqual( metadata.getSectorList() );
							expect( config.sectors.validators[ 0 ].fn ).toEqual( validators.isSector );
						} );
					} );

					describe( 'When there is one sector in the session', () => {
						it( 'Should setup the form correctly', async () => {

							req.session.sectors = [ 2 ];

							await controller.add( req, res, next );

							const args = Form.calls.argsFor( 0 );
							const config = args[ 1 ];

							expect( Form ).toHaveBeenCalled();
							expect( args[ 0 ] ).toEqual( req );

							expect( config.sectors ).toBeDefined();
							expect( config.sectors.type ).toEqual( Form.SELECT );
							expect( config.sectors.items ).toEqual( metadata.getSectorList().filter( ( sector ) => sector.value != 2 ) );
							expect( config.sectors.validators[ 0 ].fn ).toEqual( validators.isSector );
						} );
					} );
				} );

				describe( 'When there are sectors in the session', () => {
					it( 'Should render with the session sectors', () => {

						const mySectors = createSectors();
						req.session.sectors = mySectors;

						checkRender( mySectors );
					} );
				} );

				describe( 'When there are NOT sectors in the session', () => {
					it( 'Should render with the sectors from the report', () => {

						const mySectors = createSectors();
						req.report.sectors = mySectors;

						checkRender( mySectors );
					} );
				} );

				describe( 'When there are not any sectors', () => {
					it( 'Should render with an empty array', () => {

						checkRender( [] );
					} );
				} );
			} );

			describe( 'a POST', () => {

				beforeEach( () => {

					form.isPost = true;
					req.body = {};
				} );

				describe( 'When the form is not valid', () => {
					it( 'Should render the page', () => {

						form.hasErrors = () => true;

						controller.add( req, res );

						expect( res.redirect ).not.toHaveBeenCalled();
						checkRender( [] );
					} );
				} );

				describe( 'When the form is valid', () => {
					it( 'Should add the sector to the list and redirect', () => {

						const sector = uuid();
						const sectors = createSectors();
						const expected = sectors.concat( [ sector ] );
						const sectorsResponse = '/list/sectors';

						form.hasErrors = () => false;
						form.getValues.and.callFake( () => ({ sectors: sector }) );
						urls.reports.sectors.and.callFake( () => sectorsResponse );

						req.session.sectors = sectors;

						controller.add( req, res );

						expect( req.session.sectors ).toEqual( expected );
						expect( res.redirect ).toHaveBeenCalledWith( sectorsResponse );
					} );
				} );
			} );
		} );
	} );
} );
