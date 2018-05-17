const proxyquire = require( 'proxyquire' );
const modulePath = '../../../../app/controllers/index';
const mockLogger = require( '../../helpers/mock-logger' );

let controller;
let logger;
let backend;
let req;
let res;

describe( 'Index controller', () => {

	beforeEach( () => {

		req = {};
		res = { render: jasmine.createSpy( 'res.render' ) };
		logger = mockLogger.create();
		backend = { getUser: jasmine.createSpy( 'backend.getUser' ) };
	
		controller = proxyquire( modulePath, {
			'../lib/backend-service': backend,
			'../lib/logger': logger
		} );
	} );

	describe( 'When the backend returns the user', () => {
	
		it( 'Should render the user', ( done ) => {

			const data = { body: 'some text' };
			const promise = Promise.resolve( data );

			backend.getUser.and.callFake( () => promise );

			controller( req, res );

			promise.then( () => {

				expect( backend.getUser ).toHaveBeenCalledWith( req );
				expect( res.render ).toHaveBeenCalledWith( 'index', { data: data.body } );
				done();
			} );
		} );
	} );

	describe( 'When the backend throws an error', () => {
	
		it( 'Should render an error message and log the error', () => {

			const err = new Error( 'Something is broken' );
			const promise = Promise.reject( err );

			backend.getUser.and.callFake( () => promise );

			controller( req, res );

			process.nextTick( () => {

				expect( logger.error ).toHaveBeenCalledWith( err );
				expect( res.render ).toHaveBeenCalledWith( 'index', { error: 'No backend available' } );
			} );
		} );
	} );
} );
