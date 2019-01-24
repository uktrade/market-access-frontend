const proxyquire = require( 'proxyquire' );
const modulePath = './errors';

describe( 'errors middleware', function(){

	let err;
	let req;
	let res;
	let next;
	let config;
	let middleware;
	let reporter;

	beforeEach( function(){

		req = {};
		res = {
			status: jasmine.createSpy( 'res.status' ),
			render: jasmine.createSpy( 'res.render' ),
			sendStatus: jasmine.createSpy( 'res.sendStatus' )
		};
		next = jasmine.createSpy( 'next' );

		config = {
			showErrors: false
		};
		reporter = {
			captureException: jasmine.createSpy( 'reporter.captureException' )
		};

		middleware = proxyquire( modulePath, {
			'../config': config,
			'../lib/reporter': reporter
		} );
	} );

	describe( 'Errors middleware', function(){
		describe( 'catchAll', function(){

			beforeEach( function(){

				err = new Error( 'test' );
			} );

			describe( 'When the headers have been sent', function(){
				it( 'Should call the next handler with the error', function(){

					res.headersSent = true;

					middleware.catchAll( err, req, res, next );

					expect( res.status ).not.toHaveBeenCalled();
					expect( res.render ).not.toHaveBeenCalled();
					expect( reporter.captureException ).not.toHaveBeenCalled();
					expect( next ).toHaveBeenCalledWith( err );
				} );
			} );

			describe( 'When the headers have not been sent', function(){
				describe( 'A generic error', function(){
					it( 'Should log the error and send a response with the right status code', function(){

						middleware.catchAll( err, req, res, next );

						expect( res.status ).toHaveBeenCalledWith( 500 );
						expect( res.render ).toHaveBeenCalledWith( 'error/default', { showErrors: config.showErrors, error: err } );
						expect( reporter.captureException ).not.toHaveBeenCalled();
						expect( next ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'A TOO_MANY_BYTES error', function(){
					it( 'Should return a 413 status', function(){

						const tooManyBytesError = new Error( 'Too many bytes' );
						tooManyBytesError.code = 'TOO_MANY_BYTES';

						middleware.catchAll( tooManyBytesError, req, res, next );

						expect( res.sendStatus ).toHaveBeenCalledWith( 413 );
						expect( reporter.captureException ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'A EBADCSRFTOKEN error', function(){
					it( 'Should return a 400 status', function(){

						const invalidCsrfTokenError = new Error( 'Invalid csrf token' );
						invalidCsrfTokenError.code = 'EBADCSRFTOKEN';

						middleware.catchAll( invalidCsrfTokenError, req, res, next );

						expect( res.status ).toHaveBeenCalledWith( 400 );
						expect( res.render ).toHaveBeenCalledWith( 'error/invalid-csrf-token' );
						expect( reporter.captureException ).not.toHaveBeenCalled();
					} );
				} );
			} );
		} );

		describe( '404', function(){
			it( 'Should render the 404 page and send the right status code', function(){

				middleware.handle404( req, res, next );

				expect( res.status ).toHaveBeenCalledWith( 404 );
				expect( res.render ).toHaveBeenCalledWith( 'error/404' );
				expect( next ).not.toHaveBeenCalled();
			} );
		} );
	} );
} );
