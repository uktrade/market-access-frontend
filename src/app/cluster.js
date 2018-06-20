/* eslint no-console: 0 */
const cluster = require( 'cluster' );
const config = require( './config' );
const logger = require( './lib/logger' );
const createApp = require( './app' ).create;

const serverConfig = config.server;
const numberOfWorkers = serverConfig.workers;
const isClustered = ( numberOfWorkers > 1 );

async function startApp(){

	let app;

	try {

		app = await createApp();

	} catch( e ){

		console.error( 'Caught error when trying to create app' );
		console.error( e );
		process.exit( 1 );
		return;
	}

	if( !app ){

		console.error( 'Unable to create app' );
		return;
	}

	const env = app.get( 'env' );

	app.listen( serverConfig.port, function(){

		let messages = [];

		if( isClustered ){

			messages.push( `Worker ${ cluster.worker.id } created` );
		}

		messages.push( `App running in ${ env } mode, workers: ${ config.server.workers }, available: ${ config.server.cpus }` );
		messages.push( `SSO bypass: ${ config.sso.bypass }` );
		messages.push( `Listening at http://${serverConfig.host}:${serverConfig.port}` );

		logger.info( messages.join( '   ' ) );
	});

	if( isClustered && config.isDev ){

		app.use( function( req, res, next ){

			logger.debug( 'Worker: %s, handling request: %s', cluster.worker.id, req.url );
			next();
		} );
	}
}

if( isClustered ){
	//if this is the master then create the workers
	if( cluster.isMaster ){

		for( let i = 0; i < numberOfWorkers; i++ ) {

			cluster.fork();
		}
	//if we are a worker then create an HTTP server
	} else {
		startApp();
	}

} else {
	startApp();
}
