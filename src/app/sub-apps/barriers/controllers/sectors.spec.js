const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

const modulePath = './sectors';

const SELECT = 'select';

describe( 'Barrier sectors controller', () => {

	let controller;
	let req;
	let res;
	let next;
	let backend;
	let urls;
	let csrfToken;
	let Form;
	let form;
	let getValuesResponse;
	let getTemplateValuesResponse;
	let validators;
	let barrierId;
	let metadata;

	beforeEach( () => {

		csrfToken = uuid();
		barrierId = uuid();

		( { req, res, next, csrfToken } = jasmine.helpers.mocks.middleware() );

		req.barrierSession = jasmine.helpers.mocks.barrierSession();
		req.barrier = {
			id: barrierId
		};

		res = {
			render: jasmine.createSpy( 'res.render' ),
			redirect: jasmine.createSpy( 'res.redirect' )
		};
		next = jasmine.createSpy( 'next' );
		backend = {
			barriers: {
				saveSectors: jasmine.createSpy( 'backend.barriers.saveSectors' )
			}
		};

		urls = {
			index: jasmine.createSpy( 'urls.index' ),
			barriers: {
				detail: jasmine.createSpy( 'urls.barriers.detail' ),
				sectors: {
					list: jasmine.createSpy( 'urls.barriers.sectors.list' ),
					add: jasmine.createSpy( 'urls.barriers.sectors.add' ),
					new: jasmine.createSpy( 'urls.barriers.sectors.new' ),
				}
			}
		};

		metadata = {
			barrierTypes: [
				{ id: 1, title: 'barrier 1', category: 'GOODS', description: 'some text' },
				{ id: 2, title: 'barrier 2', category: 'SERVICES', description: 'a bit more text' }
			],
			barrierTypeCategories: {
				'GOODS': 'title 1',
				'SERVICES': 'title 2'
			},
			getSector: jasmine.createSpy( 'metadata.getSector' ),
			getSectorList: () => [
				{
					value: 'value1',
					text: 'text 1'
				},{
					value: 'value2',
					text: 'text 2'
				},{
					value: 'value3',
					text: 'text 3'
				},{
					value: 'value4',
					text: 'text 4'
				}
			]
		};

		getValuesResponse = { a: 1, b: 2 };
		getTemplateValuesResponse = { c: 3, d: 4 };
		form = {
			validate: jasmine.createSpy( 'form.validate' ),
			getValues: jasmine.createSpy( 'form.getValues' ).and.callFake( () => getValuesResponse ),
			getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.callFake( () => Object.assign( {}, getTemplateValuesResponse ) )
		};
		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );
		Form.SELECT = SELECT;

		validators = {
			isSector: jasmine.createSpy( 'validators.isSector' ),
		};

		controller = proxyquire( modulePath, {
			'../../../lib/backend-service': backend,
			'../../../lib/Form': Form,
			'../../../lib/urls': urls,
			'../../../lib/validators': validators,
			'../../../lib/metadata': metadata
		} );
	} );

	function createSectors(){
		return [ uuid(), uuid() ];
	}

	describe( 'Sectors', () => {

		let sectorResponse;
		let sectors;
		let sectorsList;

		beforeEach( () => {

			sectorResponse = {
				id: uuid(),
				name: 'test sector'
			};

			sectors = createSectors();
			metadata.getSector.and.callFake( () => sectorResponse );
			sectorsList = metadata.getSectorList();
			sectorsList.push( { value: sectors[ 0 ], name: 'sector 1' } );

			metadata.getSectorList = () => sectorsList;
		} );

		describe( 'list', () => {

			const template = 'barriers/views/sectors/list';

			describe( 'a GET request', () => {
				describe( 'With sectors in the session', () => {
					it( 'Should use the list and render the template', () => {

						req.barrierSession.sectors.list.get.and.callFake( () => sectors );
						req.barrierSession.sectors.all.get.and.callFake( () => false );

						controller.list( req, res, next );

						expect( metadata.getSector.calls.count() ).toEqual( sectors.length );

						expect( res.render ).toHaveBeenCalledWith( template, {
							sectors: sectors.map( () => sectorResponse ),
							allSectors: false,
							csrfToken
						} );
					} );
				} );

				describe( 'Without any sectors', () => {
					it( 'Should render the template with an empty list', () => {

						req.barrierSession.sectors.list.get.and.callFake( () => [] );
						req.barrierSession.sectors.all.get.and.callFake( () => false );

						controller.list( req, res, next );

						expect( res.render ).toHaveBeenCalledWith( template, { sectors: [], allSectors: false, csrfToken } );
					} );
				} );

				describe( 'With all sectors selected', () => {
					it( 'Should render the template with an empty list', () => {

						req.barrierSession.sectors.list.get.and.callFake( () => [] );
						req.barrierSession.sectors.all.get.and.callFake( () => true );

						controller.list( req, res, next );

						expect( res.render ).toHaveBeenCalledWith( template, { sectors: [], allSectors: true, csrfToken } );
					} );
				} );
			} );

			describe( 'a POST request', () => {

				beforeEach( () => {

					req.method = 'POST';
					req.barrierSession.sectors.list.get.and.callFake( () => sectors );
					req.barrierSession.sectors.all.get.and.callFake( () => false );
				} );

				describe( 'With an error', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'failed API call' );

						backend.barriers.saveSectors.and.callFake( () => Promise.reject( err ) );

						await controller.list( req, res, next );

						expect( backend.barriers.saveSectors ).toHaveBeenCalledWith( req, req.barrier.id, sectors, false );
						expect( req.barrierSession.sectors.all.delete ).toHaveBeenCalled();
						expect( req.barrierSession.sectors.list.delete ).toHaveBeenCalled();
						expect( next ).toHaveBeenCalledWith( err );
						expect( res.render ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'Without an error', () => {
					describe( 'When the request is a success', () => {
						it( 'Should redirect to the barrir detail page', async () => {

							const response = { isSuccess: true };
							const detailResponse = '/detail/url';

							backend.barriers.saveSectors.and.callFake( () => ({ response }) );
							urls.barriers.detail.and.callFake( () => detailResponse );

							await controller.list( req, res, next );

							expect( req.barrierSession.sectors.all.delete ).toHaveBeenCalled();
							expect( req.barrierSession.sectors.list.delete ).toHaveBeenCalled();
							expect( next ).not.toHaveBeenCalled();
							expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
						} );
					} );

					describe( 'When the request is not a success', () => {
						it( 'Should call next with an error', async () => {

							const response = { isSuccess: false, statusCode: 500 };

							backend.barriers.saveSectors.and.callFake( () => ({ response }) );

							await controller.list( req, res, next );

							const err = new Error( `Unable to update barrier, got ${ response.statusCode } response code` );

							expect( req.barrierSession.sectors.all.delete ).toHaveBeenCalled();
							expect( req.barrierSession.sectors.list.delete ).toHaveBeenCalled();
							expect( next ).toHaveBeenCalledWith( err );
						} );
					} );
				} );
			} );
		} );

		describe( 'edit', () => {

			const template = 'barriers/views/sectors/list';

			describe( 'a GET request', () => {

				beforeEach(() => {
					req.barrierSession.sectors.list.get.and.callFake( () => sectors );
					req.barrierSession.sectors.all.get.and.callFake( () => false );
				});

				describe( 'With sectors in the session', () => {
					it( 'Should overwrite the list and render the template', () => {

						controller.edit( req, res, next );

						expect( metadata.getSector.calls.count() ).toEqual( sectors.length );

						expect( res.render ).toHaveBeenCalledWith( template, {
							sectors: sectors.map( () => sectorResponse ),
							allSectors: false,
							csrfToken
						} );
					} );
				} );

				describe( 'With sectors in the barrier', () => {
					it( 'Should put the list in the sesison and render the template', () => {

						req.barrier.sectors = sectors;

						controller.edit( req, res, next );

						expect( metadata.getSector.calls.count() ).toEqual( sectors.length );

						expect( res.render ).toHaveBeenCalledWith( template, {
							sectors: sectors.map( () => sectorResponse ),
							allSectors: false,
							csrfToken
						} );
					} );
				} );

				describe( 'Without any sectors', () => {
					it( 'Should put an empty list in the session and render the template', () => {

						req.barrierSession.sectors.list.get.and.callFake( () => [] );

						controller.edit( req, res, next );

						expect( metadata.getSector.calls.count() ).toEqual( 0 );
						expect( res.render ).toHaveBeenCalledWith( template, { sectors: [], allSectors: false, csrfToken } );
					} );
				} );

				describe( 'With all sectors', () => {
					it( 'Should put an empty list in the session and render the template', () => {

						req.barrierSession.sectors.list.get.and.callFake( () => [] );
						req.barrierSession.sectors.all.get.and.callFake( () => true );

						controller.edit( req, res, next );

						expect( metadata.getSector.calls.count() ).toEqual( 0 );
						expect( res.render ).toHaveBeenCalledWith( template, { sectors: [], allSectors: true, csrfToken } );
					} );
				} );
			} );
		} );

		describe( 'remove', () => {
			it( 'Should remove the matching sector', () => {

				const sector1 = uuid();
				const sector2 = uuid();
				const sectors = [ sector1, sector2 ];
				const listResponse = '/list/sectors';

				req.body = { sector: sector1 };
				req.barrierSession.sectors.list.get.and.callFake( () => sectors );
				urls.barriers.sectors.list.and.callFake( () => listResponse );

				controller.remove( req, res );

				expect( req.barrierSession.sectors.list.set ).toHaveBeenCalledWith( [sector2] );
				expect( res.redirect ).toHaveBeenCalledWith( listResponse );
			} );
		} );

		describe( 'Adding new sectors', () => {

			const template = 'barriers/views/sectors/add';

			function checkAddRender( template, sectors, href ){

				expect( res.render ).toHaveBeenCalledWith( template, Object.assign( {},
					getTemplateValuesResponse,
					{ currentSectors: sectors.map( () => sectorResponse ) },
					{ href },
				) );
			}

			function checkFormConfig( items ){

				const args = Form.calls.argsFor( 0 );
				const config = args[ 1 ];

				expect( config.sectors ).toBeDefined();
				expect( config.sectors.type ).toEqual( SELECT );
				expect( config.sectors.items ).toEqual( items );
				expect( config.sectors.validators.length ).toEqual( 2 );
				expect( config.sectors.validators[ 0 ].fn ).toEqual( validators.isSector );
				expect( typeof config.sectors.validators[ 1 ].fn ).toEqual( 'function' );
				expect( config.sectors.validators[ 1 ].fn() ).toEqual( true );

				if( req.barrierSession.sectors.list.get.length ){
					expect( config.sectors.validators[ 1 ].fn( req.barrierSession.sectors.list.get[ 0 ] ) ).toEqual( false );
				}
			}

			describe( 'add', () => {

				const urlsSectorsAddResponse = '/add/sector/';
				const urlsSectorsListResponse = '/list/sectors/';

				function checkRender( sectors ){

					checkAddRender( template, sectors, {
						cancel: urlsSectorsListResponse,
						form: urlsSectorsAddResponse
					} );
				}

				beforeEach( () => {
					req.barrierSession.sectors.list.get.and.callFake( () => sectors);

					urls.barriers.sectors.list.and.callFake( () => urlsSectorsListResponse );
					urls.barriers.sectors.add.and.callFake( () => urlsSectorsAddResponse );
				} );

				describe( 'a GET request', () => {

					describe( 'When there are no sectors in the session', () => {
						it( 'Should render the template', () => {

							req.barrierSession.sectors.list.get.and.callFake( () => []);

							controller.add( req, res );

							checkFormConfig( sectorsList );
							checkRender( [] );
						} );
					} );

					describe( 'When there are some sectors in the session', () => {
						it( 'Should remove the sectors from the list', () => {

							req.session.list = sectors;

							controller.add( req, res );

							checkFormConfig( sectorsList.filter( ( sector ) => !sectors.includes( sector.value ) ) );
							checkRender( sectors );
						} );
					} );

					describe( 'When there are some sectors in the barrier', () => {
						it( 'Should remove the sectors from the list and put the sectors in the session', () => {

							req.barrier.sectors = sectors;

							controller.add( req, res );

							checkFormConfig( sectorsList.filter( ( sector ) => !sectors.includes( sector.value ) ) );
							checkRender( sectors );
						} );
					} );
				} );

				describe( 'a POST request', () => {

					beforeEach( () => {

						form.isPost = true;
					} );

					describe( 'When the form has errors', () => {
						it( 'Should render the template', () => {

							req.barrierSession.sectors.list.get.and.callFake( () => []);

							form.hasErrors = () => true;

							controller.add( req, res );

							checkRender( [] );
						} );
					} );

					describe( 'When the form does not have any errors', () => {

						const listResponse = '/list/sectors';
						let sector;

						beforeEach( () => {

							sector = uuid();
							form.hasErrors = () => false;
							getValuesResponse.sectors = sector;
							urls.barriers.sectors.list.and.callFake( () => listResponse );
						} );

						afterEach( () => {

							expect( res.redirect ).toHaveBeenCalledWith( listResponse );
						} );

						describe( 'When there aren\'t any sectors in the session', () => {
							it( 'Should add the sector to the session', () => {

								controller.add( req, res );
								expect(req.barrierSession.sectors.list.set).toHaveBeenCalledWith(sectors);
							} );
						} );

						describe( 'When there are some sectors in the session', () => {
							it( 'Should add the sector to the session list', () => {

								const sectorList = sectors.concat( sector );
								req.session.list = sectors;

								controller.add( req, res );

								expect( req.session.list ).toEqual( sectorList );
							} );
						} );
					} );
				} );
			} );

			describe( 'add all sectors', () => {
				it('should add all sectors into the session and clear barrierSectors session', () => {

					const listResponse = '/list/sectors';
					urls.barriers.sectors.list.and.callFake( () => listResponse );

					req.session.all = false;
					req.session.list = ['1234'];
					
					controller.addAllSectors( req, res );

					expect( req.barrierSession.sectors.all.set ).toHaveBeenCalledWith( true );
					expect( req.barrierSession.sectors.list.set ).toHaveBeenCalledWith( [] );

					expect( res.redirect ).toHaveBeenCalledWith( listResponse );
				});
			});

			describe( 'remove all sectors', () => {
				it('should add all sectors into the session and clear barrierSectors session', () => {

					req.session.all = true;

					const listResponse = '/list/sectors';
					urls.barriers.sectors.list.and.callFake( () => listResponse );
					
					controller.removeAllSectors( req, res );

					expect( req.barrierSession.sectors.all.set ).toHaveBeenCalledWith( false );

					expect( res.redirect ).toHaveBeenCalledWith( listResponse );
				});
			});

			describe( 'new', () => {

				const urlsSectorsNewResponse = '/new/sector/';
				const urlsBarrierDetailResponse = '/barrier/';

				function checkRender( sectors ){

					checkAddRender( template, sectors, {
						cancel: urlsBarrierDetailResponse,
						form: urlsSectorsNewResponse
					} );
				}

				beforeEach( () => {

					urls.barriers.detail.and.callFake( () => urlsBarrierDetailResponse );
					urls.barriers.sectors.new.and.callFake( () => urlsSectorsNewResponse );
					req.barrierSession.sectors.list.get.and.callFake( () => []);
				} );

				describe( 'a GET request', () => {


					describe( 'When there are no sectors in the session', () => {
						it( 'Should render the template', () => {

							controller.new( req, res );

							checkFormConfig( sectorsList );
							checkRender( [] );
							expect(req.barrierSession.sectors.list.set).toHaveBeenCalledWith([]);
						} );
					} );

					describe( 'When there are some sectors in the session', () => {
						it( 'Should render with an empty list and remove the session sectors', () => {

							req.barrierSession.sectors.list.get.and.callFake( () => []);

							controller.new( req, res );

							checkFormConfig( sectorsList );
							checkRender( [] );
							expect(req.barrierSession.sectors.list.set).toHaveBeenCalledWith([]);
						} );
					} );

					describe( 'When there are some sectors in the barrier', () => {
						it( 'Should render an empty list', () => {

							req.barrier.sectors = sectors;

							controller.new( req, res );

							checkFormConfig( sectorsList );
							checkRender( [] );
							expect(req.barrierSession.sectors.list.set).toHaveBeenCalledWith( [] );
						} );
					} );
				} );

				describe( 'a POST request', () => {

					beforeEach( () => {

						form.isPost = true;

					} );

					describe( 'When the form has errors', () => {
						it( 'Should render the template', () => {

							form.hasErrors = () => true;

							controller.new( req, res );

							checkRender( [] );
						} );
					} );

					describe( 'When the form does not have any errors', () => {

						const listResponse = '/list/sectors';
						let sector;

						beforeEach( () => {

							sector = uuid();
							form.hasErrors = () => false;
							getValuesResponse.sectors = sector;
							urls.barriers.sectors.list.and.callFake( () => listResponse );

							req.barrierSession.sectors.list.get.and.callFake( () => []);
						} );

						afterEach( () => {

							expect( res.redirect ).toHaveBeenCalledWith( listResponse );
						} );

						describe( 'When there aren\'t any sectors in the session', () => {
							it( 'Should add the sector to the session', () => {

								controller.new( req, res );	

								expect(req.barrierSession.sectors.list.set).toHaveBeenCalledWith([sector]);
								expect(req.barrierSession.sectors.all.set).toHaveBeenCalledWith(false);
							} );
						} );

						describe( 'When there are some sectors in the session', () => {
							it( 'Should add the sector to the session list', () => {

								req.session.list = sectors;

								controller.new( req, res );

								expect(req.barrierSession.sectors.list.set).toHaveBeenCalledWith([sector]);
								expect(req.barrierSession.sectors.all.set).toHaveBeenCalledWith(false);
							} );
						} );
					} );
				} );
			} );
		} );
	} );
} );
