const proxyquire = require( 'proxyquire' );
const modulePath = './user-watch-list';

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
				expect( watchList.watchList ).toEqual( { version: 2, lists: [] } );
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

		beforeEach( () => {

			watchList = new UserWatchList( req );
		} );

		describe( '#add', () => {
			describe( 'When the response is a success', () => {

				beforeEach( () => {
					backend.watchList.save.and.callFake( () => Promise.resolve( { response: { isSuccess: true  } } ) );
				} );

				describe( 'When there is a user profile', () => {
					it( 'Saves the watchList and replaces it on the profile', async () => {

						req.session.user.user_profile = {
							test: 1,
							watchList: {
								version: '1',
								filters: { b: 2 }
							}
						};

						const name = 'test 2';
						const filters = { c: 3 };

						const newProfile = {
							test: 1,
							watchList: {
								version: 2,
								lists : [
									{
										name,
										filters,
									}
								]
							}
						};

						await watchList.add( name, filters );

						expect( req.session.user.user_profile ).toEqual( newProfile );
						expect( backend.watchList.save ).toHaveBeenCalledWith( req, newProfile );
					} );
				} );

				describe( 'When there is not a user profile', () => {
					it( 'Saves the watchList and creates a profile', async () => {

						const name = '3';
						const filters =  { c: 4 };
						const newWatchList = {
							version: 2,
							lists: [
								{
									name,
									filters,
								}
							]
						};

						const expectedProfile = { watchList: { ...newWatchList } };

						await watchList.add( name, filters );

						expect( req.session.user.user_profile ).toEqual( expectedProfile );
						expect( backend.watchList.save ).toHaveBeenCalledWith( req, expectedProfile );
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
