const config = require( '../config' );
const winston = require( 'winston' );

const colorize = config.isDev;

const logger = new winston.Logger({
	level: config.logLevel,
	transports: [
		new winston.transports.Console( { colorize } )
	]
});

module.exports = logger;
