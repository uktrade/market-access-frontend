const uuid = require( 'uuid/v4' );
const middleware = require( './barrier-session' );

describe( 'barrier session middleware', () => {

	let req;
	let res;
	let next;
	let id;

	beforeEach( () => {

		id = uuid();
		( { req, res, next } = jasmine.helpers.mocks.middleware() );
	} );

	function checkForSession(){

		expect( req.session.barriers[ id ] ).toEqual( {} );

		expect( typeof req.barrierSession.get ).toEqual( 'function' );
		expect( typeof req.barrierSession.delete ).toEqual( 'function' );
		expect( typeof req.barrierSession.set ).toEqual( 'function' );
		expect( typeof req.barrierSession.setIfNotAlready ).toEqual( 'function' );

		expect( typeof req.barrierSession.types.get ).toEqual( 'function' );
		expect( typeof req.barrierSession.types.delete ).toEqual( 'function' );
		expect( typeof req.barrierSession.types.set ).toEqual( 'function' );
		expect( typeof req.barrierSession.types.setIfNotAlready ).toEqual( 'function' );
	}

	describe( 'Without a barrier or uuid', () => {
		it( 'Should throw an error', () => {

			middleware( req, res, next );

			expect( next ).toHaveBeenCalledWith( new Error( 'Cannot create barrier session without an id' ) );
		} );
	} );

	describe( 'With a uuid', () => {

		beforeEach( () => {

			req.uuid = id;
		} );

		it( 'Should create the barrier session', () => {

			middleware( req, res, next );

			checkForSession();
			expect( next ).toHaveBeenCalledWith();
		} );

		describe( 'When there is a session object', () => {
			it( 'Should append to it', () => {

				req.session.barriers = { abc: true };

				middleware( req, res, next );

				expect( req.session.barriers ).toEqual( { abc: true, [ id ]: {} } );

				req.barrierSession.set( 'test', 1 );

				expect( req.session.barriers ).toEqual( { abc: true, [ id ]: { test: 1 } } );
			} );
		} );

		describe( 'When there is a session and barrier object', () => {
			it( 'Should append to it', () => {

				req.session.barriers = {
					[ id ]: { test: 1 },
					abc: 'def',
				};

				middleware( req, res, next );

				expect( req.session.barriers ).toEqual( {
					[ id ]: { test: 1 },
					abc: 'def',
				} );

				req.barrierSession.set( 'test-two', true );

				expect( req.session.barriers ).toEqual( {
					[ id ]: { test: 1, 'test-two': true },
					abc: 'def',
				} );
			} );
		} );
	} );

	describe( 'With a barrier', () => {

		beforeEach( () => {

			req.barrier = { id };

			middleware( req, res, next );
		} );

		afterEach( () => {

			expect( next ).toHaveBeenCalledWith();
		} );

		it( 'Should create the barrier session', () => {

			checkForSession();
		} );

		describe( 'Default methods', () => {

			let key;
			let value;

			beforeEach( () => {

				key = 'test-key';
				value = { test: uuid() };
			} );

			describe( 'get', () => {
				describe( 'With no data', () => {
					it( 'Sould return undefined', () => {

						expect( req.barrierSession.get( key ) ).toEqual( undefined );
					} );
				} );

				describe( 'With some data set', () => {
					it( 'Should return the data', () => {

						req.session.barriers[ id ][ key ] = value;

						expect( req.barrierSession.get( key ) ).toEqual( value );
					} );
				} );
			} );

			describe( 'delete', () => {
				describe( 'With no data', () => {
					it( 'Should do nothing', () => {

						expect( () => req.barrierSession.delete( key ) ).not.toThrow();
					} );
				} );

				describe( 'With some data', () => {
					it( 'Should delete the data', () => {

						req.session.barriers[ id ][ key ] = value;
						req.barrierSession.delete( key );

						expect( typeof req.session.barriers[ id ][ key ] ).toEqual( 'undefined' );
					} );
				} );
			} );

			describe( 'set', () => {
				describe( 'With no data', () => {
					it( 'Should set the data', () => {

						req.barrierSession.set( key, value );

						expect( req.session.barriers[ id ][ key ] ).toEqual( value );
					} );
				} );

				describe( 'With some existing data', () => {
					it( 'Should overwrite the data', () => {

						req.session.barriers[ id ][ key ] = { existing: true };
						req.barrierSession.set( key, value );

						expect( req.session.barriers[ id ][ key ] ).toEqual( value );
					} );
				} );
			} );

			describe( 'setIfNotAlready', () => {
				describe( 'With no data', () => {
					it( 'Should set the data', () => {

						req.barrierSession.setIfNotAlready( key, value );

						expect( req.session.barriers[ id ][ key ] ).toEqual( value );
					} );
				} );

				describe( 'With some existing data', () => {
					it( 'Should note overwrite the data', () => {

						const existingValue = { existing: true };

						req.session.barriers[ id ][ key ] = existingValue;
						req.barrierSession.setIfNotAlready( key, value );

						expect( req.session.barriers[ id ][ key ] ).toEqual( existingValue );
					} );
				} );
			} );
		} );

		describe( 'types', () => {

			const key = 'types';
			let value;

			beforeEach( () => {

				value = uuid();
			} );

			describe( 'get', () => {
				describe( 'With no data', () => {
					it( 'Should return undefined', () => {

						expect( req.barrierSession[key].get() ).toEqual( undefined );
					} );
				} );

				describe( 'With some data set', () => {
					it( 'Should return the data', () => {

						req.session.barriers[ id ][ key ] = value;

						expect( req.barrierSession[key].get() ).toEqual( value );
					} );
				} );
			} );

			describe( 'delete', () => {
				describe( 'With no data', () => {
					it( 'Should do nothing', () => {

						expect( () => req.barrierSession[key].delete() ).not.toThrow();
					} );
				} );

				describe( 'With some data', () => {
					it( 'Should delete the data', () => {

						req.session.barriers[ id ][ key ] = value;
						req.barrierSession[key].delete();

						expect( typeof req.session.barriers[ id ][ key ] ).toEqual( 'undefined' );
					} );
				} );
			} );

			describe( 'set', () => {
				describe( 'With no data', () => {
					it( 'Should set the data', () => {

						req.barrierSession[key].set( value );

						expect( req.session.barriers[ id ][ key ] ).toEqual( value );
					} );
				} );

				describe( 'With some existing data', () => {
					it( 'Should overwrite the data', () => {

						req.session.barriers[ id ][ key ] = { existing: true };
						req.barrierSession[key].set( value );

						expect( req.session.barriers[ id ][ key ] ).toEqual( value );
					} );
				} );
			} );

			describe( 'setIfNotAlready', () => {
				describe( 'With no data', () => {
					it( 'Should set the data', () => {

						req.barrierSession[key].setIfNotAlready( value );

						expect( req.session.barriers[ id ][ key ] ).toEqual( value );
					} );
				} );

				describe( 'With some existing data', () => {
					it( 'Should note overwrite the data', () => {

						const existingValue = { existing: true };

						req.session.barriers[ id ][ key ] = existingValue;
						req.barrierSession[key].setIfNotAlready( value );

						expect( req.session.barriers[ id ][ key ] ).toEqual( existingValue );
					} );
				} );
			} );
		} );
		describe( 'sectors', () => {

			describe( 'all', () => {

				const key = 'all';
				let value;
	
				beforeEach( () => {
	
					value = uuid();
				} );
	
				describe( 'get', () => {
					describe( 'With no data', () => {
						it( 'Should return undefined', () => {
	
							expect( req.barrierSession.sectors[key].get() ).toEqual( undefined );
						} );
					} );
	
					describe( 'With some data set', () => {
						it( 'Should return the data', () => {
	
							req.session.barriers[ id ][ key ] = value;
	
							expect( req.barrierSession.sectors[key].get() ).toEqual( value );
						} );
					} );
				} );
	
				describe( 'delete', () => {
					describe( 'With no data', () => {
						it( 'Should do nothing', () => {
	
							expect( () => req.barrierSession.sectors[key].delete() ).not.toThrow();
						} );
					} );
	
					describe( 'With some data', () => {
						it( 'Should delete the data', () => {
	
							req.session.barriers[ id ][ key ] = value;
							req.barrierSession.sectors[key].delete();
	
							expect( typeof req.session.barriers[ id ][ key ] ).toEqual( 'undefined' );
						} );
					} );
				} );
	
				describe( 'set', () => {
					describe( 'With no data', () => {
						it( 'Should set the data', () => {
	
							req.barrierSession.sectors[key].set( value );
	
							expect( req.session.barriers[ id ][ key ] ).toEqual( value );
						} );
					} );
	
					describe( 'With some existing data', () => {
						it( 'Should overwrite the data', () => {
	
							req.session.barriers[ id ][ key ] = { existing: true };
							req.barrierSession.sectors[key].set( value );
	
							expect( req.session.barriers[ id ][ key ] ).toEqual( value );
						} );
					} );
				} );
	
				describe( 'setIfNotAlready', () => {
					describe( 'With no data', () => {
						it( 'Should set the data', () => {
	
							req.barrierSession.sectors[key].setIfNotAlready( value );
	
							expect( req.session.barriers[ id ][ key ] ).toEqual( value );
						} );
					} );
	
					describe( 'With some existing data', () => {
						it( 'Should note overwrite the data', () => {
	
							const existingValue = { existing: true };
	
							req.session.barriers[ id ][ key ] = existingValue;
							req.barrierSession.sectors[key].setIfNotAlready( value );
	
							expect( req.session.barriers[ id ][ key ] ).toEqual( existingValue );
						} );
					} );
				} );
			} );
			describe( 'list', () => {

				const key = 'list';
				let value;
	
				beforeEach( () => {
	
					value = uuid();
				} );
	
				describe( 'get', () => {
					describe( 'With no data', () => {
						it( 'Should return undefined', () => {
	
							expect( req.barrierSession.sectors[key].get() ).toEqual( undefined );
						} );
					} );
	
					describe( 'With some data set', () => {
						it( 'Should return the data', () => {
	
							req.session.barriers[ id ][ key ] = value;
	
							expect( req.barrierSession.sectors[key].get() ).toEqual( value );
						} );
					} );
				} );
	
				describe( 'delete', () => {
					describe( 'With no data', () => {
						it( 'Should do nothing', () => {
	
							expect( () => req.barrierSession.sectors[key].delete() ).not.toThrow();
						} );
					} );
	
					describe( 'With some data', () => {
						it( 'Should delete the data', () => {
	
							req.session.barriers[ id ][ key ] = value;
							req.barrierSession.sectors[key].delete();
	
							expect( typeof req.session.barriers[ id ][ key ] ).toEqual( 'undefined' );
						} );
					} );
				} );
	
				describe( 'set', () => {
					describe( 'With no data', () => {
						it( 'Should set the data', () => {
	
							req.barrierSession.sectors[key].set( value );
	
							expect( req.session.barriers[ id ][ key ] ).toEqual( value );
						} );
					} );
	
					describe( 'With some existing data', () => {
						it( 'Should overwrite the data', () => {
	
							req.session.barriers[ id ][ key ] = { existing: true };
							req.barrierSession.sectors[key].set( value );
	
							expect( req.session.barriers[ id ][ key ] ).toEqual( value );
						} );
					} );
				} );
	
				describe( 'setIfNotAlready', () => {
					describe( 'With no data', () => {
						it( 'Should set the data', () => {
	
							req.barrierSession.sectors[key].setIfNotAlready( value );
	
							expect( req.session.barriers[ id ][ key ] ).toEqual( value );
						} );
					} );
	
					describe( 'With some existing data', () => {
						it( 'Should note overwrite the data', () => {
	
							const existingValue = { existing: true };
	
							req.session.barriers[ id ][ key ] = existingValue;
							req.barrierSession.sectors[key].setIfNotAlready( value );
	
							expect( req.session.barriers[ id ][ key ] ).toEqual( existingValue );
						} );
					} );
				} );
			} );
		} );
	} );
} );
