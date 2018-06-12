const csurf = require( 'csurf' );

const ssoController = require( './controllers/sso' );
const indexController = require( './controllers/index' );
const reportController = require( './controllers/report' );

const headerNav = require( './middleware/header-nav' );
const user = require( './middleware/user' );
const hasStartFormValues = require( './middleware/has-start-form-values' );

const companyId = require( './middleware/params/company-id' );
const contactId = require( './middleware/params/contact-id' );
const barrierId = require( './middleware/params/barrier-id' );

const csrfProtection = csurf();
const reportHeaderNav = headerNav( { isReport: true } );

module.exports = function( express, app ){

	const parseBody = express.urlencoded( { extended: false } );

	app.get( '/login/', ssoController.authRedirect );
	app.get( '/login/callback/', ssoController.callback );

	app.use( user );

	app.param( 'companyId', companyId );
	app.param( 'contactId', contactId );
	app.param( 'barrierId', barrierId );

	app.get( '/', headerNav( { isDashboard: true } ), indexController );
	app.get( '/report/', reportHeaderNav, reportController.index );
	app.get( '/report/start/', reportHeaderNav, csrfProtection, reportController.start );
	app.post( '/report/start/', reportHeaderNav, parseBody, csrfProtection, reportController.start );
	app.get( '/report/company/', reportHeaderNav, hasStartFormValues, reportController.companySearch );
	app.get( '/report/company/:companyId', reportHeaderNav, hasStartFormValues, csrfProtection, reportController.companyDetails );
	app.post( '/report/new/', reportHeaderNav, hasStartFormValues, parseBody, csrfProtection, reportController.saveNew );
	app.get( '/report/:barrierId/company/:companyId/contacts/', reportHeaderNav, reportController.contacts );
	app.get( '/report/:barrierId/contact/:contactId', reportHeaderNav, csrfProtection, reportController.contactDetails );
	app.post( '/report/:barrierId/save/contact/', reportHeaderNav, parseBody, csrfProtection, reportController.saveContact );
	app.get( '/report/:barrierId/problem/', reportHeaderNav, csrfProtection, reportController.aboutProblem );
};
