const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const faker = require( 'faker' );
const modulePath = './watch-list';

let controller;
let req;
let res;
let next;
let csrfToken;
let getValuesResponse;
let getTemplateValuesResponse;
let urls;
let metadata;
let getFromQueryString;
let getFromQueryStringResponse;
let Form;
let form;
let transformFilterValue;
let transformFilterValueResponse;
let config;

describe( 'Watch list controller', () => {

	beforeEach( () => {

		( { req, res, next, csrfToken } = jasmine.helpers.mocks.middleware() );

		req.session.user = { user_profile: {} };

		urls = {
			index: jasmine.createSpy( 'urls.index' )
		};

		config = {
			maxWatchLists: 3,
		};

		metadata = {
			getCountry: jasmine.createSpy( 'validators.getCountry' ),
			getSector: jasmine.createSpy( 'validators.getSector' ),
			getBarrierType: jasmine.createSpy( 'validators.getBarrierType' ),
			getBarrierPriority: jasmine.createSpy( 'validators.getBarrierPriority' ),
			getOverseasRegion: jasmine.createSpy( 'validators.getOverseasRegion' ),
		};

		getValuesResponse = { name: 'Test name' };
		getTemplateValuesResponse = { c: 3, d: 4 };
		getFromQueryStringResponse = { country: [ 'a' ], sector: [ 'b' ] };
		transformFilterValueResponse = uuid();

		form = {
			validate: jasmine.createSpy( 'form.validate' ),
			getValues: jasmine.createSpy( 'form.getValues' ).and.callFake( () => getValuesResponse ),
			getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.callFake( () => Object.assign( {}, getTemplateValuesResponse ) )
		};

		Form = jasmine.createSpy( 'Form' ).and.callFake( () => form );
		getFromQueryString = jasmine.createSpy().and.callFake( () => getFromQueryStringResponse );
		transformFilterValue = jasmine.createSpy( 'barrierFilters.transformFilterValue' ).and.callFake( () => transformFilterValueResponse );

		controller = proxyquire( modulePath, {
			'../lib/metadata': metadata,
			'../lib/barrier-filters': { getFromQueryString, transformFilterValue },
			'../lib/Form': Form,
			'../lib/urls': urls,
			'../config': config,
		} );
	} );

	describe ( '#save', () => {

		function checkRender(){

			expect( res.render ).toHaveBeenCalledWith( 'watch-list', {
				...getTemplateValuesResponse,
				filters: getFromQueryStringResponse,
				canReplace: false,
				hasToReplace: false,
				isEdit: false,
				queryString: req.query,
				filterList: Object.keys( getFromQueryStringResponse ).map( ( key ) => ({ key, value: transformFilterValueResponse }) ),
				csrfToken,
			} );
		}

		describe( 'When it is a GET', () => {
			it( 'Should setup the form correctly', async () => {

				await controller.save( req, res, next );

				const config = Form.calls.argsFor( 0 )[1];

				expect( config.name ).toBeDefined();
				expect( config.name.required ).toBeDefined();
			});

			it( 'Should render the template with showWarning as false', async () => {

				await controller.save( req, res, next );

				checkRender();
			});
		});

		describe( 'When it is a POST', () => {

			beforeEach( () => {
				form.isPost = true;
			} );

			describe( 'When the form data is not valid', () => {
				it( 'Should render the template', async () => {

					form.hasErrors = () => true;

					await controller.save( req, res, next );

					checkRender();
					expect( req.watchList.update ).not.toHaveBeenCalled();
					expect( req.watchList.add ).not.toHaveBeenCalled();
				} );
			} );

			describe( 'When the form data is valid', () => {

				beforeEach( () => {
					form.hasErrors = () => false;
				} );

				describe( 'When there are no errors', () => {

					let indexResponse;

					beforeEach( () => {

						indexResponse = '/';
						urls.index.and.callFake( () => indexResponse );
					} );

					afterEach( () => {

						expect( req.session.user ).not.toBeDefined();
						expect( res.redirect ).toHaveBeenCalledWith( indexResponse );
					} );

					describe( 'Without an existing watchList', () => {
						it( 'Adds the watch list and redirects to the dashboard', async () => {

							await controller.save( req, res, next );

							expect( req.watchList.add ).toHaveBeenCalledWith( getValuesResponse.name, getFromQueryStringResponse );
						});
					} );

					describe( 'With an existing watchList', () => {

						beforeEach( () => {

							req.watchList.lists = [ { name: faker.lorem.words( 2 ), filters: { filter1: 'a', filter2: 'b' } } ];
						} );

						describe( 'When in edit mode', () => {
							describe( 'When the index is valid', () => {
								it( 'Should setup the form correcty and update the list', async () => {

									req.query.editList = '0';

									await controller.save( req, res, next );

									const config = Form.calls.argsFor( 0 )[1];

									expect( config.name.values ).toEqual( [ req.watchList.lists[ 0 ].name ] );
									expect( req.watchList.update ).toHaveBeenCalledWith( req.query.editList, getValuesResponse.name, getFromQueryStringResponse );
									expect( urls.index ).toHaveBeenCalledWith( '0' );
								} );
							} );
						} );

						describe( 'When more lists can be added', () => {
							describe( 'When a new is selected on the form', () => {
								it( 'Adds the new list and redirects to the dashboard', async () => {

									req.watchList.add.and.callFake( ( name, filters ) => req.watchList.lists.push( { name, filters } ) );

									getValuesResponse.replaceOrNew = 'new';

									await controller.save( req, res, next );

									expect( req.watchList.add ).toHaveBeenCalledWith( getValuesResponse.name, getFromQueryStringResponse );
									expect( urls.index ).toHaveBeenCalledWith( 1 );
								} );
							} );

							describe( 'When replace list is selected on the form', () => {
								it( 'Replaces the values of the list', async () => {

									const replaceIndex = '4';
									getValuesResponse.replaceOrNew = 'replace';
									getValuesResponse.replaceIndex = replaceIndex;

									await controller.save( req, res, next );

									expect( req.watchList.update ).toHaveBeenCalledWith( replaceIndex, getValuesResponse.name, getFromQueryStringResponse );
									expect( urls.index ).toHaveBeenCalledWith( replaceIndex );
								} );
							} );
						} );

						describe( 'When no more lists can be added', () => {
							it( 'Replaces the values of the list', async () => {

								const replaceIndex = '5';
								getValuesResponse.replaceIndex = replaceIndex;
								req.watchList.lists.push( { name: faker.lorem.words( 2 ), filters: { filter3: '3', filter4: '4' } } );
								req.watchList.lists.push( { name: faker.lorem.words( 2 ), filters: { filter5: '5', filter6: '6' } } );

								await controller.save( req, res, next );

								expect( req.watchList.update ).toHaveBeenCalledWith( replaceIndex, getValuesResponse.name, getFromQueryStringResponse );
								expect( urls.index ).toHaveBeenCalledWith( replaceIndex );
							} );
						} );
					} );
				});

				describe( 'When there is an error', () => {
					describe( 'When the add call fails', () => {
						it( 'Should call next with the error', async () => {

							const err = new Error( 'some error' );
							req.watchList.add.and.callFake( () => Promise.reject( err ) );

							await controller.save( req, res, next );

							expect( next ).toHaveBeenCalledWith( err );
							expect( req.session.user ).toBeDefined();
							expect( res.redirect ).not.toHaveBeenCalled();
							expect( res.render ).not.toHaveBeenCalled();
						} );
					} );

					describe( 'When editList index is not valid', () => {
						it( 'Calls next with an error', async () => {

							req.query.editList = '10';

							await controller.save( req, res, next );

							expect( next ).toHaveBeenCalledWith( new Error( 'No watchlist found to edit' ) );
							expect( res.redirect ).not.toHaveBeenCalled();
							expect( res.render ).not.toHaveBeenCalled();
							expect( req.watchList.update ).not.toHaveBeenCalled();
							expect( req.watchList.add ).not.toHaveBeenCalled();
						} );
					} );
				});
			} );
		});
	});

	describe( '#rename', () => {
		describe( 'When there is not a matching watchList', () => {
			it( 'Calls next with an error', async () => {

				req.params.index = '100';

				await controller.rename( req, res, next );

				expect( next ).toHaveBeenCalledWith( new Error( 'Watch list not found' ) );
				expect( res.redirect ).not.toHaveBeenCalled();
				expect( req.session.user ).toBeDefined();
				expect( res.render ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'When there is a matching watchList', () => {

			beforeEach( () => {

				req.params.index = '0';
				req.watchList.lists = [ { name: faker.lorem.words( 3 ), filters: { type: 1 } } ];
			} );

			function checkRender(){

				expect( res.render ).toHaveBeenCalledWith( 'watch-list', {
					...getTemplateValuesResponse,
					isRename: true,
					watchListIndex: 0,
					queryString: req.query,
					filterList: [ { key: 'type', value: transformFilterValueResponse } ],
					csrfToken,
				} );
			}

			describe( 'When it is a GET', () => {
				it( 'Renders the template with the correct data', async () => {

					await controller.rename( req, res, next );

					checkRender();
				} );
			} );

			describe( 'When it is a POST', () => {

				beforeEach( () => {
					form.isPost = true;
				} );

				describe( 'When there are errors', () => {
					it( 'Renders the template', async () => {

						form.hasErrors = jasmine.createSpy( 'form.hasErrors' ).and.callFake( () => true );

						await controller.rename( req, res, next );

						checkRender();
					} );
				} );

				describe( 'When there are no errors', () => {

					beforeEach( () => {

						form.hasErrors = jasmine.createSpy( 'form.hasErrors' ).and.callFake( () => false );
					} );

					describe( 'When watchList.update throws an error', () => {
						it( 'Calls next with the error', async () => {

							const err = new Error( 'update fail' );

							req.watchList.update.and.callFake( () => Promise.reject( err ) );

							await controller.rename( req, res, next );

							expect( next ).toHaveBeenCalledWith( err );
							expect( req.session.user ).toBeDefined();
							expect( res.render ).not.toHaveBeenCalled();
							expect( res.redirect ).not.toHaveBeenCalled();
						} );
					} );

					describe( 'When watchList.update is successful', () => {
						it( 'Deletes the user from the sesion and redirects to the index url', async () => {

							const indexResponse = '/';

							getValuesResponse = { name: 'testing' };
							urls.index.and.callFake( () => indexResponse );

							await controller.rename( req, res, next );

							expect( next ).not.toHaveBeenCalled();
							expect( req.session.user ).not.toBeDefined();
							expect( res.redirect ).toHaveBeenCalledWith( indexResponse );
							expect( urls.index ).toHaveBeenCalledWith( 0 );
						} );
					} );
				} );
			} );
		} );
	} );

	describe ( '#remove', () => {
		describe( 'Without an error', () => {

			beforeEach( () => {

				req.watchList.remove.and.callFake( () => Promise.resolve( {} ) );
			} );

			describe( 'With a valid index', () => {
				it( 'Clears the watch list from the user profile', async () => {

					const indexResponse = '/';

					req.params.index = '10';
					urls.index.and.callFake( () => indexResponse );

					await controller.remove( req, res, next );

					expect( req.session.user ).toBeUndefined();
					expect( req.watchList.remove ).toHaveBeenCalledWith( 10 );
					expect( res.redirect ).toHaveBeenCalledWith( indexResponse );
				});
			} );

			describe( 'With an invalid index', () => {
				it( 'Calls next with an error', async () => {

					req.params.index = 'abc';

					await controller.remove( req, res, next );

					expect( next ).toHaveBeenCalledWith( new Error( 'Invalid watch list index' ) );
					expect( req.watchList.remove ).not.toHaveBeenCalled();
					expect( req.session.user ).toBeDefined();
				} );
			} );
		});

		describe( 'With an error', () => {
			it( 'Should call next with the error', async () => {

				const err = new Error( 'issue with watchlist' );

				req.params.index = '5';
				req.watchList.remove.and.callFake( () => Promise.reject( err ) );

				await controller.remove( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
				expect( req.session.user ).toBeDefined();
				expect( res.redirect ).not.toHaveBeenCalled();
			} );
		});
	});
});
