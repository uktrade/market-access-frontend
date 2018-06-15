const csurf = require( 'csurf' );

const ssoController = require( './controllers/sso' );
const indexController = require( './controllers/index' );
const reportController = require( './controllers/report' );

const headerNav = require( './middleware/header-nav' );
const user = require( './middleware/user' );
const hasStartFormValues = require( './middleware/has-start-form-values' );
const hasCompany = require( './middleware/has-company' );

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

	app.get( '/report/:barrierId?/start/', reportHeaderNav, csrfProtection, reportController.start );
	app.post( '/report/:barrierId?/start/', reportHeaderNav, parseBody, csrfProtection, reportController.start );

	app.get( '/report/:barrierId?/company/', reportHeaderNav, hasStartFormValues, reportController.companySearch );
	app.get( '/report/:barrierId?/company/:companyId', reportHeaderNav, hasStartFormValues, csrfProtection, reportController.companyDetails );
	app.post( '/report/:barrierId?/company/', reportHeaderNav, hasStartFormValues, parseBody, csrfProtection, reportController.companyDetails );

	app.get( '/report/:barrierId?/company/:companyId/contacts/', reportHeaderNav, hasStartFormValues, hasCompany, reportController.contacts );
	app.get( '/report/:barrierId?/contact/:contactId', reportHeaderNav, hasStartFormValues, hasCompany, csrfProtection, reportController.contactDetails );

	app.post( '/report/:barrierId?/save/', reportHeaderNav, hasStartFormValues, hasCompany, parseBody, csrfProtection, reportController.save );

	app.get( '/report/:barrierId/problem/', reportHeaderNav, csrfProtection, reportController.aboutProblem );
};
