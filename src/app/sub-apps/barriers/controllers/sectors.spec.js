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

		req = {
			barrier: {
				id: barrierId
			},
			csrfToken: () => csrfToken,
			session: {},
			params: {}
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
					list: jasmine.createSpy( 'urls.barriers.sectors.list' )
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
			affectedSectorsList: [
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
			getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.callFake( () => getTemplateValuesResponse )
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

	describe( 'Sectors', () => {

		let sectorResponse;
		let sectors;

		beforeEach( () => {

			sectorResponse = {
				id: uuid(),
				name: 'test sector'
			};

			sectors = [ uuid(), uuid() ];
			metadata.getSector.and.callFake( () => sectorResponse );
			metadata.affectedSectorsList.push( { value: sectors[ 0 ], name: 'sector 1' } );
		} );

		describe( 'list', () => {

			const template = 'barriers/views/sectors/list';

			describe( 'a GET request', () => {
				describe( 'With sectors in the session', () => {
					it( 'Should use the list and render the template', () => {

						req.session.barrierSectors = sectors;

						controller.list( req, res, next );

						expect( metadata.getSector.calls.count() ).toEqual( sectors.length );

						expect( res.render ).toHaveBeenCalledWith( template, {
							sectors: sectors.map( () => sectorResponse ),
							csrfToken
						} );
					} );
				} );

				describe( 'With sectors in the barrier', () => {
					it( 'Should use put the list in the sesison and render the template', () => {

						req.barrier.sectors = sectors;

						controller.list( req, res, next );

						expect( metadata.getSector.calls.count() ).toEqual( sectors.length );
						expect( req.session.barrierSectors ).toEqual( sectors );

						expect( res.render ).toHaveBeenCalledWith( template, {
							sectors: sectors.map( () => sectorResponse ),
							csrfToken
						} );
					} );
				} );

				describe( 'Without an sectors', () => {
					it( 'Should render the template with an empty list', () => {

						controller.list( req, res, next );

						expect( res.render ).toHaveBeenCalledWith( template, { sectors: [], csrfToken } );
					} );
				} );
			} );

			describe( 'a POST request', () => {

				beforeEach( () => {

					req.method = 'POST';
					req.session.barrierSectors = sectors;
				} );

				describe( 'With an error', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'failed API call' );

						backend.barriers.saveSectors.and.callFake( () => Promise.reject( err ) );

						await controller.list( req, res, next );

						expect( backend.barriers.saveSectors ).toHaveBeenCalledWith( req, req.barrier.id, sectors );
						expect( req.session.barrierSectors ).not.toBeDefined();
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

							expect( req.session.barrierSectors ).not.toBeDefined();
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

							expect( req.session.barrierSectors ).not.toBeDefined();
							expect( next ).toHaveBeenCalledWith( err );
						} );
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
				req.session.barrierSectors = sectors;
				urls.barriers.sectors.list.and.callFake( () => listResponse );

				controller.remove( req, res );

				expect( req.session.barrierSectors ).toEqual( [ sector2 ] );
				expect( res.redirect ).toHaveBeenCalledWith( listResponse );
			} );
		} );

		describe( 'add', () => {

			const template = 'barriers/views/sectors/add';

			function checkRender(){
				expect( res.render ).toHaveBeenCalledWith( template, Object.assign(
					getTemplateValuesResponse,
					{ currentSectors: sectors.map( () => sectorResponse ) }
				) );
			}

			describe( 'a GET request', () => {

				function checkFormConfig( items ){

					const args = Form.calls.argsFor( 0 );
					const config = args[ 1 ];

					expect( config.sectors ).toBeDefined();
					expect( config.sectors.type ).toEqual( SELECT );
					expect( config.sectors.items ).toEqual( items );
					expect( config.sectors.validators.length ).toEqual( 2 );
					expect( config.sectors.validators[ 0 ].fn ).toEqual( validators.isSector );
					expect( typeof config.sectors.validators[ 1 ].fn ).toEqual( 'function' );
				}

				describe( 'When there are no sectors in the session', () => {
					it( 'Should render the template', () => {

						controller.add( req, res );

						checkFormConfig( metadata.affectedSectorsList );
						checkRender();
					} );
				} );

				describe( 'When there are some sectors in the session', () => {
					it( 'Should remove the sectors from the list', () => {

						req.session.barrierSectors = sectors;

						controller.add( req, res );

						checkFormConfig( metadata.affectedSectorsList.filter( ( sector ) => !sectors.includes( sector.value ) ) );
						checkRender();
					} );
				} );

				describe( 'When there are some sectors in the barrier', () => {
					it( 'Should remove the sectors from the list and put the sectors in the session', () => {

						req.barrier.sectors = sectors;

						controller.add( req, res );

						checkFormConfig( metadata.affectedSectorsList.filter( ( sector ) => !sectors.includes( sector.value ) ) );
						checkRender();
						expect( req.session.barrierSectors ).toEqual( sectors );
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

						controller.add( req, res );

						checkRender();
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

							expect( req.session.barrierSectors ).toEqual( [ sector ] );
						} );
					} );

					describe( 'When there are some sectors in the session', () => {
						it( 'Should add the sector to the session list', () => {

							const sectorList = sectors.concat( sector );
							req.session.barrierSectors = sectors;

							controller.add( req, res );

							expect( req.session.barrierSectors ).toEqual( sectorList );
						} );
					} );
				} );
			} );
		} );
	} );
} );
