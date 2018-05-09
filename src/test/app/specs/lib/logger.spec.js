const proxyquire = require( 'proxyquire' );

let consoleStub;
let loggerStub;
let logLevel;

function createLogger( isDev = false ){

	logLevel = 'debug';
	loggerStub = jasmine.createSpy( 'winston.Logger' ).and.callFake( () => function(){} );
	consoleStub = jasmine.createSpy( 'winston.transports.Console' ).and.callFake( () => function(){} );

	const stubs = {
		'winston': {
			Logger: loggerStub,
			transports: {
				Console: consoleStub
			}
		},
		'../config': {
			logLevel,
			isDev
		}
	};

	return proxyquire( '../../../../app/lib/logger', stubs );
}

describe( 'logger', function(){

	it( 'Creates a logger with the correct log level', function(){

		createLogger();

		expect( loggerStub ).toHaveBeenCalled();
		expect( loggerStub.calls.argsFor( 0 )[ 0 ].level ).toEqual( logLevel );
	} );

	describe( 'In production', function(){

		it( 'Should set colorize to false', function(){

			createLogger( false );

			expect( consoleStub ).toHaveBeenCalledWith( { colorize: false } );
		} );
	} );

	describe( 'In development', function(){

		it( 'Should set colorize to true', function(){

			createLogger( true );

			expect( consoleStub ).toHaveBeenCalledWith( { colorize: true } );
		} );
	} );
} );
