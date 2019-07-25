const express = require( 'express' );
const nunjucks = require( 'nunjucks' );
const path = require( 'path' );
const morganLogger = require( 'morgan' );
const compression = require( 'compression' );
const flash = require( 'connect-flash' );

const routes = require( './routes' );
const config = require( './config' );

const reporter = require( './lib/reporter' );
const staticGlobals = require( './lib/static-globals' );
const nunjucksFilters = require( './lib/nunjucks-filters' );
const metatdata = require( './lib/metadata' );

const ping = require( './middleware/ping' );
const forceHttps = require( './middleware/force-https' );
const headers = require( './middleware/headers' );
const errors = require( './middleware/errors' );
const sessionStore = require( './middleware/session-store' );
const auth = require( './middleware/auth' );
const ssoBypass = require( './middleware/sso-bypass' );

module.exports = {

	create: async () => {

		const app = express();
		const isDev = config.isDev;
		const pathToPublic = path.resolve( __dirname, '../public' );
		const pathToGovukAssets = path.resolve( __dirname, '../../node_modules/govuk-frontend/assets' );
		const pathToNodeModules = path.resolve( __dirname, ( isDev ? '../' : '' ) + '../node_modules' );
		const staticMaxAge = ( isDev ? 0 : '2y' );

		const nunjucksEnv = nunjucks.configure( [
			`${__dirname}/views`,
			`${__dirname}/sub-apps`,
			`${ pathToNodeModules }/govuk-frontend`,
			`${ pathToNodeModules }/@uktrade`,
		], {
			trimBlocks: true,
			lstripBlocks: true,
			autoescape: true,
			watch: isDev,
			noCache: !config.views.cache,
			express: app
		} );

		try {

			await metatdata.fetch();

		} catch ( e ) {

			throw e;
		}

		app.set( 'view engine', 'njk' );
		app.set( 'view cache', config.views.cache );
		app.disable( 'x-powered-by' );

		staticGlobals( nunjucksEnv );
		nunjucksFilters( nunjucksEnv );
		reporter.setup( app );

		if( isDev ){
			app.use( express.static( `${ pathToNodeModules }/@uktrade` ) );
		} else {
			app.use( compression() );
		}
		app.use( forceHttps( config.server.secure ) );
		app.use( '/public', express.static( pathToPublic, { maxAge: staticMaxAge } ) );
		app.use( '/govuk-public', express.static( pathToGovukAssets, { maxAge: staticMaxAge } ) );
		app.use( morganLogger( ( isDev ? 'dev' : 'combined' ) ) );
		app.use( headers( isDev ) );
		app.use( ping );

		app.use( sessionStore.create() );
		if( isDev ){ app.use( ssoBypass ); }
		app.use( auth );
		app.use( flash() );

		routes( express, app );

		app.use( errors.handle404 );

		reporter.handleErrors( app );

		app.use( errors.catchAll );

		return app;
	}
};
