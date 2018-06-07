const csurf = require( 'csurf' );

const ssoController = require( './controllers/sso' );
const indexController = require( './controllers/index' );
const reportController = require( './controllers/report' );

const headerNav = require( './middleware/header-nav' );
const user = require( './middleware/user' );
const hasStartFormValues = require( './middleware/has-start-form-values' );

const urls = require( './lib/urls' );
const datahub =require( './lib/datahub-service' );

const csrfProtection = csurf();
const reportHeaderNav = headerNav( { isReport: true } );

module.exports = function( express, app ){

	const parseBody = express.urlencoded( { extended: false } );

	app.param( 'companyId', async ( req, res, next, id ) => {

		try {

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
	app.get( urls.report.start(), reportHeaderNav, csrfProtection, reportController.start );
	app.post( urls.report.start(), parseBody, reportHeaderNav, csrfProtection, reportController.start );
	app.get( urls.report.company(), reportHeaderNav, hasStartFormValues, reportController.companySearch );
	app.get( urls.report.company() + ':companyId', reportHeaderNav, hasStartFormValues, csrfProtection, reportController.companyDetails );
	app.post( urls.report.saveNew(), reportHeaderNav, hasStartFormValues, parseBody, csrfProtection, reportController.saveNew );
};
