const proxyquire = require( 'proxyquire' );
const modulePath = './reporter';

const version = 'v1.0.0';

let reporter;
let logger;
let raven;

describe( 'Error reporter', function(){

	function createReporter( opts = {} ){

		raven = {
			captureMessage: jasmine.createSpy( 'raven.captureMessage' ),
			config: jasmine.createSpy( 'raven.config' ).and.callFake( function(){ return { install: raven.install }; } ),
			install: jasmine.createSpy( 'raven.install' ),
			requestHandler: jasmine.createSpy( 'raven.requestHandler' ),
			errorHandler: jasmine.createSpy( 'raven.errorHandler' ),
			captureException: jasmine.createSpy( 'raven.captureException' )
		};

		logger = {
			warn: jasmine.createSpy( 'logger.warn' ),
			error: jasmine.createSpy( 'logger.error' ),
			debug: jasmine.createSpy( 'logger.debug' )
		};

		reporter = proxyquire( modulePath, {
			'raven': opts.raven || raven,
			'./logger': opts.logger || logger,
			'../config':  opts.config || { version }
		} );
	}

	describe( 'When a Sentry DSN is configured', function(){

		const dsn = 'test1234';

		beforeEach( function(){

			createReporter( { config: { sentryDsn: dsn, version } } );
		} );

		describe( 'On load of module', function(){
			it( 'Should setup and install raven', function(){

				expect( raven.config ).toHaveBeenCalledWith( dsn, { release: version } );
				expect( raven.install ).toHaveBeenCalled();
			} );
		} );

		describe( 'Setup', function(){
			it( 'Should invoke the responseHandler', function(){

				const appStub = {
					use: jasmine.createSpy( 'app.use' )
				};

				reporter.setup( appStub );

				expect( appStub.use ).toHaveBeenCalled();
				expect( raven.requestHandler ).toHaveBeenCalled();
			} );
		} );

		describe( 'handleErrors', function(){
			it( 'Should invoke the errorHandler', function(){

				const appStub = {
					use: jasmine.createSpy( 'app.use' )
				};

				reporter.handleErrors( appStub );

				expect( appStub.use ).toHaveBeenCalled();
				expect( raven.errorHandler ).toHaveBeenCalled();
			} );
		} );

		describe( 'A message', function(){
			it( 'It should send the message to sentry', function(){

				const msg = 'Test';
				const level = 'test';
				const extra = {
					blah: 'test',
					foo: 'test'
				};

				reporter.message( level, msg, extra );

				expect( raven.captureMessage ).toHaveBeenCalledWith( msg, {
					level,
					extra
				} );
			} );
		} );

		describe( 'captureException', function(){
			it( 'Should raise an exception', function(){

				const err = new Error( 'test exception' );
				const myExtra = { something: 'true' };

				reporter.captureException( err, myExtra );

				expect( raven.captureException ).toHaveBeenCalledWith( err, { extra: myExtra } );
			} );
		} );
	} );

	describe( 'When a DSN is not configured', function(){

		beforeEach( function(){

			createReporter();
		} );

		describe( 'On load of the module', function(){
			it( 'Should not setup or install raven', function(){

				expect( raven.config ).not.toHaveBeenCalled();
				expect( raven.install ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'Setup', function(){
			it( 'Should not invoke the responseHandler', function(){

				const appStub = {
					use: jasmine.createSpy( 'app.use' )
				};

				reporter.setup( appStub );

				expect( appStub.use ).not.toHaveBeenCalled();
				expect( raven.requestHandler ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'handleErrors', function(){
			it( 'Should not invoke the errorHandler', function(){

				const appStub = {
					use: jasmine.createSpy( 'app.use' )
				};

				reporter.handleErrors( appStub );

				expect( appStub.use ).not.toHaveBeenCalled();
				expect( raven.errorHandler ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'A message', function(){
			describe( 'Without any extra', () => {
				it( 'Should log the error to the logger', function(){

					const msg = 'Test logger';
					const level = 'test';

					reporter.message( level, msg );

					expect( raven.captureMessage ).not.toHaveBeenCalled();
					expect( logger.warn ).toHaveBeenCalledWith( msg );
					expect( logger.warn.calls.count() ).toEqual( 1 );
				} );
			} );
			describe( 'With extra', () => {
				it( 'Should log the error to the logger', function(){

					const msg = 'Test logger';
					const level = 'test';
					const extra = {
						blah: 'test',
						foo: 'test'
					};

					reporter.message( level, msg, extra );

					expect( raven.captureMessage ).not.toHaveBeenCalled();
					expect( logger.warn ).toHaveBeenCalledWith( msg );
					expect( logger.warn ).toHaveBeenCalledWith( JSON.stringify( extra ) );
					expect( logger.warn.calls.count() ).toEqual( 2 );
				} );
			} );
		} );

		describe( 'captureException', function(){
			describe( 'Without any extra', () => {
				it( 'Should log the error with the logger', function(){

					const err = new Error( 'Test exception' );

					reporter.captureException( err );

					expect( raven.captureException ).not.toHaveBeenCalled();
					expect( logger.error ).toHaveBeenCalledWith( err.stack );
					expect( logger.error.calls.count() ).toEqual( 1 );
				} );
			} );

			describe( 'With extra', () => {
				it( 'Should log the error with the logger', function(){

					const err = new Error( 'Test exception' );
					const extra = { response: 'test' };

					reporter.captureException( err, extra );

					expect( raven.captureException ).not.toHaveBeenCalled();
					expect( logger.error ).toHaveBeenCalledWith( err.stack );
					expect( logger.error ).toHaveBeenCalledWith( JSON.stringify( extra ) );
					expect( logger.error.calls.count() ).toEqual( 2 );
				} );
			} );
		} );
	} );
} );
