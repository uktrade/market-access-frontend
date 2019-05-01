const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const faker = require( 'faker' );

const modulePath = './types';

const RADIO = 'radio';

describe( 'Barrier types controller', () => {

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
	let sortGovukItems;

	beforeEach( () => {

		barrierId = uuid();

		( { req, res, next, csrfToken } = jasmine.helpers.mocks.middleware() );

		req.barrierSession = jasmine.helpers.mocks.barrierSession();
		req.barrier = {
			id: barrierId
		};

		backend = {
			barriers: {
				saveTypes: jasmine.createSpy( 'backend.barriers.saveTypes' )
			}
		};

		urls = {
			index: jasmine.createSpy( 'urls.index' ),
			barriers: {
				detail: jasmine.createSpy( 'urls.barriers.detail' ),
				types: {
					list: jasmine.createSpy( 'urls.barriers.types.list' ),
					add: jasmine.createSpy( 'urls.barriers.types.add' ),
					new: jasmine.createSpy( 'urls.barriers.types.new' ),
				}
			}
		};

		metadata = {
			barrierTypes: [
				{ id: 1000, title: 'barrier 1', category: 'GOODS', description: 'some text' },
				{ id: 1001, title: 'barrier 2', category: 'SERVICES', description: 'a bit more text' }
			],
			getBarrierType: jasmine.createSpy( 'metadata.getBarrierType' ),
		};

		getValuesResponse = { a: 1, b: 2 };
		getTemplateValuesResponse = { c: 3, d: 4 };
		form = {
			validate: jasmine.createSpy( 'form.validate' ),
			getValues: jasmine.createSpy( 'form.getValues' ).and.callFake( () => getValuesResponse ),
			getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.callFake( () => Object.assign( {}, getTemplateValuesResponse ) )
		};
		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );
		Form.RADIO = RADIO;

		validators = {
			isBarrierType: jasmine.createSpy( 'validators.isBarrierType' ),
		};

		sortGovukItems = {
			alphabetical: jasmine.createSpy( 'sortGovUkItems.alphabetical' ),
		};

		controller = proxyquire( modulePath, {
			'../../../lib/backend-service': backend,
			'../../../lib/Form': Form,
			'../../../lib/urls': urls,
			'../../../lib/validators': validators,
			'../../../lib/metadata': metadata,
			'../../../lib/sort-govuk-items': sortGovukItems,
		} );
	} );

	function createTypes(){
		return [ faker.random.number( { min: 1, max: 10 } ), faker.random.number( { min: 11, max: 20 } ) ];
	}

	function barrierTypeToRadio( item ){

		const { id, title, description } = item;

		return {
			value: id,
			text: title,
			conditional: { html: `<div class="conditional-barrier-type-content">${ description.replace( '\n', '<br>' ) }</div>` }
		};
	}

	function getTypeList(){

		return metadata.barrierTypes.map( barrierTypeToRadio );
	}

	describe( 'Barrier types', () => {

		let barrierTypeResponse;
		let types;

		function getRenderTypes( types ){
			return types.map( () => barrierTypeResponse ).map( ( type ) => ({ name: type.title, id: type.id }));
		}

		beforeEach( () => {

			barrierTypeResponse = {
				id: 123,
				title: 'test type'
			};

			types = createTypes();
			metadata.getBarrierType.and.callFake( () => barrierTypeResponse );
		} );

		describe( 'list', () => {

			const template = 'barriers/views/types/list';

			describe( 'a GET request', () => {
				describe( 'With types in the session', () => {
					it( 'Should use the list and render the template', () => {

						req.barrierSession.types.get.and.callFake( () => types );

						controller.list( req, res, next );

						expect( req.barrierSession.types.get ).toHaveBeenCalled();
						expect( req.barrierSession.types.setIfNotAlready ).toHaveBeenCalledWith( [] );
						expect( metadata.getBarrierType.calls.count() ).toEqual( types.length );

						expect( res.render ).toHaveBeenCalledWith( template, {
							csrfToken,
							types: getRenderTypes( types ),
						} );
					} );
				} );

				describe( 'Without any types', () => {
					it( 'Should render the template with an empty list', () => {

						req.barrierSession.types.get.and.callFake( () => [] );

						controller.list( req, res, next );

						expect( req.barrierSession.types.get ).toHaveBeenCalled();
						expect( req.barrierSession.types.setIfNotAlready ).toHaveBeenCalledWith( [] );
						expect( res.render ).toHaveBeenCalledWith( template, { types: [], csrfToken } );
					} );
				} );
			} );

			describe( 'a POST request', () => {

				beforeEach( () => {

					req.method = 'POST';
					req.barrierSession.types.get.and.callFake( () => types );
				} );

				describe( 'With an error', () => {
					it( 'Should call next with the error', async () => {

						const err = new Error( 'failed API call' );

						backend.barriers.saveTypes.and.callFake( () => Promise.reject( err ) );

						await controller.list( req, res, next );

						expect( backend.barriers.saveTypes ).toHaveBeenCalledWith( req, req.barrier.id, types );
						expect( req.barrierSession.types.delete ).not.toHaveBeenCalled();
						expect( next ).toHaveBeenCalledWith( err );
						expect( res.render ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'Without an error', () => {
					describe( 'When the request is a success', () => {
						it( 'Should redirect to the barrir detail page', async () => {

							const response = { isSuccess: true };
							const detailResponse = '/detail/url';

							backend.barriers.saveTypes.and.callFake( () => ({ response }) );
							urls.barriers.detail.and.callFake( () => detailResponse );

							await controller.list( req, res, next );

							expect( req.barrierSession.types.delete ).toHaveBeenCalledWith();
							expect( next ).not.toHaveBeenCalled();
							expect( res.redirect ).toHaveBeenCalledWith( detailResponse );
						} );
					} );

					describe( 'When the request is not a success', () => {
						it( 'Should call next with an error', async () => {

							const response = { isSuccess: false, statusCode: 500 };

							backend.barriers.saveTypes.and.callFake( () => ({ response }) );

							await controller.list( req, res, next );

							const err = new Error( `Unable to update barrier, got ${ response.statusCode } response code` );

							expect( req.barrierSession.types.delete ).not.toHaveBeenCalled();
							expect( next ).toHaveBeenCalledWith( err );
						} );
					} );
				} );
			} );
		} );

		describe( 'edit', () => {

			const template = 'barriers/views/types/list';

			describe( 'a GET request', () => {
				describe( 'With types in the session', () => {
					it( 'Should overwirte the list and render the template', () => {

						req.barrier.barrier_types = types;
						req.barrierSession.types.get.and.callFake( () => createTypes() );

						controller.edit( req, res, next );

						expect( metadata.getBarrierType.calls.count() ).toEqual( types.length );
						expect( req.barrierSession.types.set ).toHaveBeenCalledWith( types );
						expect( res.render ).toHaveBeenCalledWith( template, {
							types: getRenderTypes( types ),
							csrfToken
						} );
					} );
				} );

				describe( 'With types in the barrier', () => {
					it( 'Should put the list in the sesison and render the template', () => {

						req.barrier.barrier_types = types;
						req.barrierSession.types.get.and.callFake( () => types );

						controller.edit( req, res, next );

						expect( metadata.getBarrierType.calls.count() ).toEqual( types.length );
						expect( req.barrierSession.types.set ).toHaveBeenCalledWith( types );
						expect( res.render ).toHaveBeenCalledWith( template, {
							types: getRenderTypes( types ),
							csrfToken
						} );
					} );
				} );

				describe( 'Without an types', () => {
					it( 'Should put an empty list in the session and render the template', () => {

						req.barrierSession.types.get.and.callFake( () => [] );

						controller.edit( req, res, next );

						expect( req.barrierSession.types.set ).toHaveBeenCalledWith( [] );
						expect( res.render ).toHaveBeenCalledWith( template, { types: [], csrfToken } );
					} );
				} );
			} );
		} );

		describe( 'remove', () => {
			describe( 'When the session values are numbers', () => {
				it( 'Should remove the matching type', () => {

					const type1 = types[ 0 ];
					const type2 = types[ 1 ];
					const listResponse = '/list/types';

					req.body = { type: String( type1 ) };
					req.barrierSession.types.get.and.callFake( () => types );
					urls.barriers.types.list.and.callFake( () => listResponse );

					controller.remove( req, res );

					expect( req.barrierSession.types.set ).toHaveBeenCalledWith( [ type2 ] );
					expect( res.redirect ).toHaveBeenCalledWith( listResponse );
				} );
			} );
		} );

		describe( 'Adding new types', () => {

			const template = 'barriers/views/types/add';

			function checkAddRender( template, href ){

				expect( res.render ).toHaveBeenCalledWith( template, {
					...getTemplateValuesResponse,
					href
				} );
			}

			function checkFormConfig( items ){

				const args = Form.calls.argsFor( 0 );
				const config = args[ 1 ];

				expect( config.barrierType ).toBeDefined();
				expect( config.barrierType.type ).toEqual( RADIO );
				expect( config.barrierType.items ).toEqual( items );
				expect( config.barrierType.validators.length ).toEqual( 2 );
				expect( config.barrierType.validators[ 0 ].fn ).toEqual( validators.isBarrierType );
				expect( typeof config.barrierType.validators[ 1 ].fn ).toEqual( 'function' );
				expect( config.barrierType.validators[ 1 ].fn() ).toEqual( true );

				//if( req.session.barrierSectors.length ){
				//	expect( config.barrierType.validators[ 1 ].fn( req.session.barrierSectors[ 0 ] ) ).toEqual( false );
				//}
			}

			describe( 'add', () => {

				const urlsTypesAddResponse = '/add/types/';
				const urlsTypesListResponse = '/list/types/';

				function checkRender(){

					checkAddRender( template, {
						cancel: urlsTypesListResponse,
						form: urlsTypesAddResponse
					} );
				}

				beforeEach( () => {

					urls.barriers.types.list.and.callFake( () => urlsTypesListResponse );
					urls.barriers.types.add.and.callFake( () => urlsTypesAddResponse );
				} );

				describe( 'a GET request', () => {

					describe( 'When there are no types in the session', () => {
						it( 'Should render the template', () => {

							req.barrierSession.types.get.and.callFake( () => [] );

							controller.add( req, res );

							checkFormConfig( getTypeList() );
							checkRender();
							expect( req.barrierSession.types.setIfNotAlready ).toHaveBeenCalledWith( [] );
						} );
					} );

					describe( 'When there are some types in the session', () => {
						it( 'Should remove the types from the list', () => {

							req.barrierSession.types.get.and.callFake( () => types );

							controller.add( req, res );

							checkFormConfig( getTypeList().filter( ( type ) => !types.includes( type.value ) ) );
							checkRender();
							expect( req.barrierSession.types.setIfNotAlready ).toHaveBeenCalledWith( [] );
						} );
					} );

					describe( 'When there are some types in the barrier', () => {
						it( 'Should remove the types from the list and put the types in the session', () => {

							req.barrier.barrier_types = types;
							req.barrierSession.types.get.and.callFake( () => types );

							controller.add( req, res );

							checkFormConfig( getTypeList().filter( ( type ) => !types.includes( type.value ) ) );
							checkRender();
							expect( req.barrierSession.types.setIfNotAlready ).toHaveBeenCalledWith( types );
						} );
					} );
				} );

				describe( 'a POST request', () => {

					beforeEach( () => {

						form.isPost = true;
						req.barrierSession.types.get.and.callFake( () => [] );
					} );

					afterEach( () => {

						expect( form.validate ).toHaveBeenCalledWith();
					} );

					describe( 'When the form has errors', () => {
						it( 'Should render the template', () => {

							form.hasErrors = () => true;

							controller.add( req, res );

							checkRender();
						} );
					} );

					describe( 'When the form does not have any errors', () => {

						const listResponse = '/list/types';
						let type;

						beforeEach( () => {

							type = 200;
							form.hasErrors = () => false;
							getValuesResponse.barrierType = String( type );
							urls.barriers.types.list.and.callFake( () => listResponse );
						} );

						afterEach( () => {

							expect( res.redirect ).toHaveBeenCalledWith( listResponse );
						} );

						describe( 'When there aren\'t any types in the session', () => {
							it( 'Should add the type to the session', () => {

								controller.add( req, res );

								expect( req.barrierSession.types.set ).toHaveBeenCalledWith( [ type ] );
							} );
						} );

						describe( 'When there are some types in the session', () => {
							it( 'Should add the type to the session list', () => {

								const typeList = types.concat( type );
								req.barrierSession.types.get.and.callFake( () => types );

								controller.add( req, res );

								expect( req.barrierSession.types.set ).toHaveBeenCalledWith( typeList );
							} );
						} );
					} );
				} );
			} );

			describe( 'new', () => {

				const urlsTypesNewResponse = '/new/sector/';
				const urlsBarrierDetailResponse = '/barrier/';

				function checkRender(){

					checkAddRender( template, {
						cancel: urlsBarrierDetailResponse,
						form: urlsTypesNewResponse
					} );
				}

				beforeEach( () => {

					urls.barriers.detail.and.callFake( () => urlsBarrierDetailResponse );
					urls.barriers.types.new.and.callFake( () => urlsTypesNewResponse );
					req.barrierSession.types.get.and.callFake( () => [] );
				} );

				describe( 'a GET request', () => {
					it( 'Should set the session types to empty and render the template', () => {

						controller.new( req, res );

						checkFormConfig( getTypeList() );
						checkRender();
						expect( req.barrierSession.types.set ).toHaveBeenCalledWith( [] );
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

							checkRender();
						} );
					} );

					describe( 'When the form does not have any errors', () => {

						const listResponse = '/list/types';
						let type;

						beforeEach( () => {

							type = 300;
							form.hasErrors = () => false;
							getValuesResponse.barrierType = String( type );
							urls.barriers.types.list.and.callFake( () => listResponse );
						} );

						afterEach( () => {

							expect( res.redirect ).toHaveBeenCalledWith( listResponse );
						} );

						describe( 'When there aren\'t any types in the session', () => {
							it( 'Should add the type to the session', () => {

								controller.new( req, res );

								expect( req.barrierSession.types.set ).toHaveBeenCalledWith( [ type ] );
							} );
						} );

						describe( 'When there are some types in the session', () => {
							it( 'Should add the type to the session list', () => {

								const typeList = types.concat( type );
								req.barrierSession.types.get.and.callFake( () => types );

								controller.new( req, res );

								expect( req.barrierSession.types.set ).toHaveBeenCalledWith( typeList );
							} );
						} );
					} );
				} );
			} );
		} );
	} );
} );
