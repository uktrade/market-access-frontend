const ssoController = require( './controllers/sso' );
const indexController = require( './controllers/index' );
const reportController = require( './controllers/report' );
const headerNav = require( './middleware/header-nav' );
const user = require( './middleware/user' );
const urls = require( './lib/urls' );
const datahub =require( './lib/datahub-service' );

const reportHeaderNav = headerNav( { isReport: true } );

module.exports = function( express, app ){

	app.param( 'companyId', async ( req, res, next, id ) => {

		try{

			const { body } = await datahub.getCompany( req, id );

			res.locals.company = body;

			next();

		} catch( e ){
			
			next( e );
		}
	} );

	app.get( '/login/', ssoController.authRedirect );
	app.get( '/login/callback/', ssoController.callback );

	app.use( user );
	
	app.get( urls.index(), headerNav( { isDashboard: true } ), indexController );
	app.get( urls.report.index(), reportHeaderNav, reportController.index );
	app.get( urls.report.start(), reportHeaderNav, reportController.start );
	app.post( urls.report.start(), reportHeaderNav, reportController.start );
	app.get( urls.report.company(), reportHeaderNav, reportController.companySearch );
	app.get( urls.report.company() + ':companyId', reportHeaderNav, reportController.companyDetails );
};
