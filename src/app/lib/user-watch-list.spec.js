const proxyquire = require( 'proxyquire' );
const faker = require( 'faker' );
const modulePath = './user-watch-list';

const CURRENT_VERSION = 2;

describe( 'User watch list', () => {

	let UserWatchList;
	let watchList;
	let req;
	let backend;

	beforeEach( () => {

		req = { session: { user: {} } };
		backend = { watchList: { save: jasmine.createSpy( 'backend.watchList.save' ) } };

		UserWatchList = proxyquire( modulePath, {
			'./backend-service': backend,
		} );
	} );

	describe( 'Creating an instance', () => {
		describe( 'When there is not an existing watchList', () => {
			it( 'Should create one', () => {

				const watchList = new UserWatchList( req );

				expect( watchList.req ).toEqual( req );
				expect( watchList.watchList ).toEqual( { version: CURRENT_VERSION, lists: [] } );
			} );
		} );

		describe( 'When there is an existing watchList', () => {
			describe( 'When it is version 1', () => {
				it( 'Throws an error', () => {

					req.session.user.user_profile = {
						watchList: {
							name: 'test',
							filters: { a: '1' },
						}
					};

					const message = 'user watchList is not the correct version';

					expect( () => new UserWatchList( req ) ).toThrow( new Error( message ) );
				} );
			} );

			describe( 'When it is version 2', () => {
				it( 'Creates the instance', () => {

					req.session.user.user_profile = {
						watchList: {
							version: 2,
							lists: [
								{
									name: 'test',
									filters: { a: '1' },
								}
							]
						}
					};

					const watchList = new UserWatchList( req );

					expect( watchList.req ).toEqual( req );
					expect( watchList.watchList ).toEqual( req.session.user.user_profile.watchList );
				} );
			} );
		} );
	} );

	describe( 'With an instance created', () => {
		describe( 'With an existing profile and watchList', () => {

			let currentProfile;

			beforeEach( () => {

				currentProfile = {
					fake: 1,
					watchList: {
						version: CURRENT_VERSION,
						lists: [{
							name: 'fake list one',
							filters: { country: 'abc-123' },
						}]
					}
				};

				//clone the current profile so we can compare
				req.session.user.user_profile = JSON.parse( JSON.stringify( currentProfile ) );

				watchList = new UserWatchList( req );
			} );

			describe( '#add', () => {

				let name;
				let filters;
				let newProfile;

				beforeEach( () => {

					name = 'test 2';
					filters = { c: 3 };

					newProfile = {
						fake: 1,
						watchList: {
							version: CURRENT_VERSION,
							lists : [
								...currentProfile.watchList.lists,
								{ name, filters },
							]
						}
					};
				} );

				describe( 'When the response is a success', () => {

					beforeEach( () => {
						backend.watchList.save.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );
					} );

					it( 'Adds to the list', async () => {

						await watchList.add( name, filters );

						expect( req.session.user.user_profile ).toEqual( newProfile );
						expect( backend.watchList.save ).toHaveBeenCalledWith( req, newProfile );
					} );
				} );

				describe( 'When the response is a 500', () => {

					beforeEach( () => {
						backend.watchList.save.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode: 500 } } ) );
					} );

					it( 'Throws an error and does not add to the list', async () => {

						try {

							await watchList.add( name, filters );
							fail();

						} catch( e ){

							expect( e ).toEqual( new Error( 'Unable to save watch list, got 500 response code' ) );
							expect( req.session.user.user_profile ).toEqual( currentProfile );
							expect( backend.watchList.save ).toHaveBeenCalledWith( req, newProfile );
						}
					} );
				} );

				describe( 'When there is an error', () => {

					let err;

					beforeEach( () => {
						err = new Error( 'failed to save' );
						backend.watchList.save.and.callFake( () => Promise.reject( err ) );
					} );

					it( 'Throws an error and does not add to the list', async () => {

						try {

							await watchList.add( name, filters );
							fail();

						} catch( e ){

							expect( e ).toEqual( err );
							expect( req.session.user.user_profile ).toEqual( currentProfile );
							expect( backend.watchList.save ).toHaveBeenCalledWith( req, newProfile );
						}
					} );
				} );
			} );

			describe( '#remove', () => {

				let newProfile;

				beforeEach( () => {

					newProfile = {
						fake: 1,
						watchList: {
							version: CURRENT_VERSION,
							lists : []
						}
					};
				} );

				describe( 'When the response is a success', () => {

					beforeEach( () => {
						backend.watchList.save.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );
					} );

					describe( 'When the index is valid', () => {
						it( 'Removes the item from the list', async () => {

							await watchList.remove( 0 );

							expect( req.session.user.user_profile ).toEqual( newProfile );
							expect( backend.watchList.save ).toHaveBeenCalledWith( req, newProfile );
						} );
					} );

					describe( 'When the index is NOT valid', () => {
						it( 'Does nothing', async () => {

							await watchList.remove( 10 );

							expect( req.session.user.user_profile ).toEqual( currentProfile );
							expect( backend.watchList.save ).not.toHaveBeenCalled();
						} );
					} );
				} );

				describe( 'When the response is a 500', () => {

					beforeEach( () => {
						backend.watchList.save.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode: 500 } } ) );
					} );

					it( 'Throws an error and does not remove the item from the list', async () => {

						try {

							await watchList.remove( 0 );
							fail();

						} catch( e ){

							expect( e ).toEqual( new Error( 'Unable to save watch list, got 500 response code' ) );
							expect( req.session.user.user_profile ).toEqual( currentProfile );
							expect( backend.watchList.save ).toHaveBeenCalledWith( req, newProfile );
						}
					} );
				} );

				describe( 'When there is an error', () => {

					let err;

					beforeEach( () => {
						err = new Error( 'failed to save' );
						backend.watchList.save.and.callFake( () => Promise.reject( err ) );
					} );

					it( 'Throws an error and does not remove the item from the list', async () => {

						try {

							await watchList.remove( 0 );
							fail();

						} catch( e ){

							expect( e ).toEqual( err );
							expect( req.session.user.user_profile ).toEqual( currentProfile );
							expect( backend.watchList.save ).toHaveBeenCalledWith( req, newProfile );
						}
					} );
				} );
			} );

			describe( '#update', () => {

				let name;
				let filters;
				let newProfile;

				beforeEach( () => {

					name = faker.lorem.words( 2 );
					filters = { sector: faker.random.uuid() };

					newProfile = {
						fake: 1,
						watchList: {
							version: CURRENT_VERSION,
							lists : [ { name, filters } ]
						}
					};
				} );

				describe( 'When the response is a success', () => {

					beforeEach( () => {
						backend.watchList.save.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );
					} );

					describe( 'When the index is valid', () => {
						it( 'Updates the item from the list', async () => {

							await watchList.update( 0, name, filters );

							expect( req.session.user.user_profile ).toEqual( newProfile );
							expect( backend.watchList.save ).toHaveBeenCalledWith( req, newProfile );
						} );
					} );

					describe( 'When the index is NOT valid', () => {
						it( 'Does nothing', async () => {

							await watchList.update( 10, name, filters );

							expect( req.session.user.user_profile ).toEqual( currentProfile );
							expect( backend.watchList.save ).not.toHaveBeenCalled();
						} );
					} );
				} );

				describe( 'When the response is a 500', () => {

					beforeEach( () => {
						backend.watchList.save.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode: 500 } } ) );
					} );

					it( 'Throws an error and does not update the item in the list', async () => {

						try {

							await watchList.update( 0, name, filters );
							fail();

						} catch( e ){

							expect( e ).toEqual( new Error( 'Unable to save watch list, got 500 response code' ) );
							expect( req.session.user.user_profile ).toEqual( currentProfile );
							expect( backend.watchList.save ).toHaveBeenCalledWith( req, newProfile );
						}
					} );
				} );

				describe( 'When there is an error', () => {

					let err;

					beforeEach( () => {
						err = new Error( 'failed to save' );
						backend.watchList.save.and.callFake( () => Promise.reject( err ) );
					} );

					it( 'Throws an error and does not update the item in the list', async () => {

						try {

							await watchList.update( 0, name, filters );
							fail();

						} catch( e ){

							expect( e ).toEqual( err );
							expect( req.session.user.user_profile ).toEqual( currentProfile );
							expect( backend.watchList.save ).toHaveBeenCalledWith( req, newProfile );
						}
					} );
				} );
			} );
		} );

		describe( 'Without an existing profile and watchList', () => {

			let currentProfile;

			beforeEach( () => {

				currentProfile = undefined;

				watchList = new UserWatchList( req );
			} );

			describe( '#add', () => {

				let name;
				let filters;
				let newProfile;

				beforeEach( () => {

					name = 'test 2';
					filters = { c: 3 };

					newProfile = {
						watchList: {
							version: CURRENT_VERSION,
							lists : [
								{ name, filters },
							]
						}
					};
				} );

				describe( 'When the response is a success', () => {

					beforeEach( () => {
						backend.watchList.save.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );
					} );

					it( 'Adds to the list', async () => {

						await watchList.add( name, filters );

						expect( req.session.user.user_profile ).toEqual( newProfile );
						expect( backend.watchList.save ).toHaveBeenCalledWith( req, newProfile );
					} );
				} );

				describe( 'When the response is a 500', () => {

					beforeEach( () => {
						backend.watchList.save.and.callFake( () => Promise.resolve( { response: { isSuccess: false, statusCode: 500 } } ) );
					} );

					it( 'Throws an error and does not add to the list', async () => {

						try {

							await watchList.add( name, filters );
							fail();

						} catch( e ){

							expect( e ).toEqual( new Error( 'Unable to save watch list, got 500 response code' ) );
							expect( req.session.user.user_profile ).toEqual( currentProfile );
							expect( backend.watchList.save ).toHaveBeenCalledWith( req, newProfile );
						}
					} );
				} );

				describe( 'When there is an error', () => {

					let err;

					beforeEach( () => {
						err = new Error( 'failed to save' );
						backend.watchList.save.and.callFake( () => Promise.reject( err ) );
					} );

					it( 'Throws an error and does not add to the list', async () => {

						try {

							await watchList.add( name, filters );
							fail();

						} catch( e ){

							expect( e ).toEqual( err );
							expect( req.session.user.user_profile ).toEqual( currentProfile );
							expect( backend.watchList.save ).toHaveBeenCalledWith( req, newProfile );
						}
					} );
				} );
			} );
		} );
	} );

	describe( 'migrateAndSave', () => {
		describe( 'When the current watchList is version 1', () => {
			it( 'Migrates the watchlist to version 2, saves it and returns true', async () => {

				const name = faker.lorem.words( 2 );
				const filters = { version: 1, is: 'here' };

				backend.watchList.save.and.callFake( () => Promise.resolve( { response: { isSuccess: true } } ) );

				req.session.user.user_profile = {
					watchList: {
						name,
						filters,
					}
				};

				const updated = await UserWatchList.migrateAndSave( req );

				expect( updated ).toEqual( true );
				expect( backend.watchList.save ).toHaveBeenCalledWith( req, {
					watchList: {
						version: CURRENT_VERSION,
						lists: [{
							name,
							filters,
						}]
					}
				} );
			} );
		} );

		describe( 'When the current watchList is version 2', () => {
			it( 'Returns false', async () => {

				req.session.user.user_profile = {
					watchList: {
						version: CURRENT_VERSION,
						filters: { c: 3, d: 4 },
					}
				};

				const updated = await UserWatchList.migrateAndSave( req );

				expect( updated ).toEqual( false );
				expect( backend.watchList.save ).not.toHaveBeenCalled();
			} );
		} );
	} );
} );
