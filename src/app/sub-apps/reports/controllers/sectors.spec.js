const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

const modulePath = './sectors';

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
			getSector: jasmine.createSpy( 'metadata.getSector' ),
			getSectorList: () => [
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
				saveSectors: jasmine.createSpy( 'backend.reports.saveSectors' )
			}
		};

		req.report = {
			id: uuid(),
		};

		urls = {
			reports: {
				isResolved: jasmine.createSpy( 'urls.reports.isResolved' ),
				detail: jasmine.createSpy( 'urls.reports.detail' ),
				aboutProblem: jasmine.createSpy( 'urls.reports.aboutProblem' ),
				sectors: {
					list: jasmine.createSpy( 'urls.reports.sectors' ),
				},
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

			function checkRender( sectors, allSectors = false ){

				expect( res.render ).toHaveBeenCalledWith( template, {
					sectors: sectors.map( metadata.getSector ),
					csrfToken,
					allSectors,
				} );
			}

			describe( 'a GET', () => {
				describe( 'With sectors in the session', () => {

					let sectors;

					beforeEach( () => {

						sectors = [ uuid(), uuid(), uuid() ];

						req.session.sectors = sectors;
					} );

					describe( 'With all_sectors on the report as true', () => {
						it( 'Should render the page with the sectors', async () => {

							req.report.all_sectors = true;

							await controller.list( req, res, next );

							checkRender( sectors );
						} );
					} );

					describe( 'With all_sectors on the report as false', () => {
						it( 'Should render the page with the sectors', async () => {

							req.report.all_sectors = false;

							await controller.list( req, res, next );

							checkRender( sectors );
						} );
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
					describe( 'With all_sectors on the report set to true', () => {
						it( 'Should render the page with and empty list with allSectors true', async () => {

							req.report.all_sectors = true;

							await controller.list( req, res, next );

							checkRender( [], true );
						} );
					} );

					describe( 'With all_sectors on the report set to false', () => {
						it( 'Should render the page with and empty list with allSectors false', async () => {

							req.report.all_sectors = false;

							await controller.list( req, res, next );

							checkRender( [] );
						} );
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
					it( 'Should set an error message and render the page', async () => {

						await controller.list( req, res, next );

						expect( req.error ).toHaveBeenCalledWith( 'add-sector-button', 'You must add at least one sector' );
						checkRender( [] );
					} );
				} );

				describe( 'With sectors', () => {

					let sectors;

					beforeEach( () => {

						sectors = [ uuid(), uuid() ];
						req.session.sectors = sectors;
					} );

					describe( 'With session.allSectors undefined', () => {

						afterEach( () => {

							expect( backend.reports.saveSectors ).toHaveBeenCalledWith( req, req.report.id, {
								sectors,
								allSectors: false,
							});
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

					describe( 'With session.allSectors true', () => {

						beforeEach( () => {

							req.session.allSectors = true;
						} );

						afterEach( () => {

							expect( backend.reports.saveSectors ).toHaveBeenCalledWith( req, req.report.id, {
								sectors,
								allSectors: true,
							});
						} );

						describe( 'When the service response is success', () => {

							beforeEach( () => {

								backend.reports.saveSectors.and.callFake( () => ({ response: { isSuccess: true } }) );
								req.report.id = uuid();
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
		} );

		describe( 'Remove', () => {
			it( 'Should remove the sector in the session list and redirect', () => {

				const sector = uuid();
				const sectors = [ uuid(), uuid(), sector ];
				const expected = sectors.slice( 0, 2 );
				const sectorsResponse = '/to/sectors';

				urls.reports.sectors.list.and.callFake( () => sectorsResponse );
				req.session.sectors = sectors;
				req.body = { sector };

				controller.remove( req, res );

				expect( req.session.sectors ).toEqual( expected );
				expect( res.redirect ).toHaveBeenCalledWith( sectorsResponse );
				expect( urls.reports.sectors.list ).toHaveBeenCalledWith( req.report.id );
			} );
		} );

		describe( 'Add', () => {

			const template = 'reports/views/add-sector';

			beforeEach( () => {

				req.report.sectors = null;
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
							expect( config.sectors.validators[ 1 ].fn( 2 ) ).toEqual( false );
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
						urls.reports.sectors.list.and.callFake( () => sectorsResponse );

						req.session.sectors = sectors;

						controller.add( req, res );

						expect( req.session.sectors ).toEqual( expected );
						expect( res.redirect ).toHaveBeenCalledWith( sectorsResponse );
					} );
				} );
			} );
		} );

		describe( 'allSectors', () => {
			it( 'Redirect to the sectors list page', () => {

				const listResponse = 'to/the/list';
				urls.reports.sectors.list.and.returnValue( listResponse );

				controller.allSectors( req, res );

				expect( res.redirect ).toHaveBeenCalledWith( listResponse, 301 );
				expect( urls.reports.sectors.list ).toHaveBeenCalledWith( req.report.id );
			} );
		} );

		describe( 'all', () => {

			let listResponse;

			beforeEach( () => {

				listResponse = '/link/to/list/';
				urls.reports.sectors.list.and.returnValue( listResponse );
			} );

			afterEach( () => {

				expect( res.redirect ).toHaveBeenCalledWith( listResponse );
			} );

			describe( 'add', () => {
				it( 'Resets the array of sectors and sets allSectors to true', () => {

					controller.all.add( req, res );

					expect( req.session.sectors ).toEqual( [] );
					expect( req.session.allSectors ).toEqual( true );
				} );
			} );

			describe( 'remove', () => {
				it( 'Resets the array of sectors and sets allSectors to false', () => {

					controller.all.remove( req, res );

					expect( req.session.sectors ).toEqual( [] );
					expect( req.session.allSectors ).toEqual( false );
				} );
			} );
		} );
	} );
} );
