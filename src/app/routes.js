const csurf = require( 'csurf' );

const ssoController = require( './controllers/sso' );
const indexController = require( './controllers/index' );
const reportController = require( './controllers/report' );

const headerNav = require( './middleware/header-nav' );
const user = require( './middleware/user' );
const hasStartFormValues = require( './middleware/has-start-form-values' );

const companyId = require( './middleware/params/company-id' );
const contactId = require( './middleware/params/contact-id' );

const urls = require( './lib/urls' );

const csrfProtection = csurf();
const reportHeaderNav = headerNav( { isReport: true } );

module.exports = function( express, app ){

	const parseBody = express.urlencoded( { extended: false } );

	app.get( '/login/', ssoController.authRedirect );
	app.get( '/login/callback/', ssoController.callback );

	app.use( user );
	app.param( 'companyId', companyId );
	app.param( 'contactId', contactId );

	app.get( urls.index(), headerNav( { isDashboard: true } ), indexController );
	app.get( urls.report.index(), reportHeaderNav, reportController.index );
	app.get( urls.report.start(), reportHeaderNav, csrfProtection, reportController.start );
	app.post( urls.report.start(), parseBody, reportHeaderNav, csrfProtection, reportController.start );
	app.get( urls.report.company(), reportHeaderNav, hasStartFormValues, reportController.companySearch );
	app.get( urls.report.company() + ':companyId', reportHeaderNav, hasStartFormValues, csrfProtection, reportController.companyDetails );
	app.post( urls.report.saveNew(), reportHeaderNav, hasStartFormValues, parseBody, csrfProtection, reportController.saveNew );
	app.get( urls.report.company() + ':companyId/contacts/', reportHeaderNav, reportController.contacts );
	app.get( '/report/contact/:contactId', reportHeaderNav, csrfProtection, reportController.contactDetails );
	app.post( urls.report.saveContact(), reportHeaderNav, parseBody, csrfProtection, reportController.saveContact );
};
