const proxyquire = require( 'proxyquire' );
const modulePath = './logger';

let consoleStub;
let createLogger;
let logLevel;
let format;
let jsonResponse;
let colorizeResponse;
let simpleFormatResponse;

function createLoggerInstance( isDev = false ){

	jsonResponse = { json: true };
	colorizeResponse = { colorize: true };
	simpleFormatResponse = { a: 'response' };

	logLevel = 'debug';
	createLogger = jasmine.createSpy( 'winston.createLogger' ).and.callFake( () => function(){} );
	consoleStub = jasmine.createSpy( 'winston.transports.Console' ).and.callFake( () => function(){} );
	format = {
		combine: jasmine.createSpy( 'format.combine' ),
		json: jasmine.createSpy( 'format.json' ).and.returnValue( jsonResponse ),
		simple: jasmine.createSpy( 'format.simple' ).and.returnValue( simpleFormatResponse ),
		colorize: jasmine.createSpy( 'format.colorize' ).and.returnValue( colorizeResponse )
	};

	const stubs = {
		'winston': {
			createLogger: createLogger,
			transports: {
				Console: consoleStub
			},
			format
		},
		'../config': {
			logLevel,
			isDev
		}
	};

	return proxyquire( modulePath, stubs );
}

describe( 'logger', function(){
	it( 'Creates a logger with the correct log level', function(){

		createLoggerInstance();

		expect( createLogger ).toHaveBeenCalled();
		expect( createLogger.calls.argsFor( 0 )[ 0 ].level ).toEqual( logLevel );
		expect( consoleStub ).toHaveBeenCalledWith( { format: simpleFormatResponse } );
	} );

	describe( 'In production', function(){
		it( 'Should set colorize to false', function(){

			createLoggerInstance( false );
			expect( format.combine ).toHaveBeenCalledWith( jsonResponse );
		} );
	} );

	describe( 'In development', function(){
		it( 'Should set colorize to true', function(){

			createLoggerInstance( true );
			expect( format.combine ).toHaveBeenCalledWith( jsonResponse, colorizeResponse );
		} );
	} );
} );
