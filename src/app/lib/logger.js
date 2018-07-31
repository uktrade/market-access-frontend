const winston = require( 'winston' );
const config = require( '../config' );

const colorize = config.isDev;
const formats = [ winston.format.json() ];

if( colorize ){

	formats.push( winston.format.colorize() );
}

const logger = winston.createLogger({
	level: config.logLevel,
	format: winston.format.combine( ...formats ),
	transports: [
		new winston.transports.Console( {
			format: winston.format.simple()
		} )
	]
});

module.exports = logger;
