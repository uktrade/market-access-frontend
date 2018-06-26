const csurf = require( 'csurf' );

const ssoController = require( './controllers/sso' );
const indexController = require( './controllers/index' );
const reportController = require( './controllers/report' );

const headerNav = require( './middleware/header-nav' );
const user = require( './middleware/user' );
const hasStartFormValues = require( './middleware/has-start-form-values' );
const hasCompany = require( './middleware/has-company' );
const formErrors = require( './middleware/form-errors' );

const companyId = require( './middleware/params/company-id' );
const contactId = require( './middleware/params/contact-id' );
const reportId = require( './middleware/params/report-id' );

const csrfProtection = csurf();
const reportHeaderNav = headerNav( { isReport: true } );

module.exports = function( express, app ){

	const parseBody = express.urlencoded( { extended: false } );

	app.get( '/login/', ssoController.authRedirect );
	app.get( '/login/callback/', ssoController.callback );

	app.use( user );
	app.use( formErrors );

	app.param( 'companyId', companyId );
	app.param( 'contactId', contactId );
	app.param( 'reportId', reportId );

	app.get( '/', headerNav( { isDashboard: true } ), indexController );
	app.get( '/report/', reportHeaderNav, reportController.index );

	app.get( '/report/:reportId?/start/', reportHeaderNav, csrfProtection, reportController.start );
	app.post( '/report/:reportId?/start/', reportHeaderNav, parseBody, csrfProtection, reportController.start );

	app.get( '/report/:reportId?/company/', reportHeaderNav, hasStartFormValues, reportController.companySearch );
	app.get( '/report/:reportId?/company/:companyId', reportHeaderNav, hasStartFormValues, csrfProtection, reportController.companyDetails );
	app.post( '/report/:reportId?/company/', reportHeaderNav, hasStartFormValues, parseBody, csrfProtection, reportController.companyDetails );

	app.get( '/report/:reportId?/company/:companyId/contacts/', reportHeaderNav, hasStartFormValues, hasCompany, reportController.contacts );
	app.get( '/report/:reportId?/contact/:contactId', reportHeaderNav, hasStartFormValues, hasCompany, csrfProtection, reportController.contactDetails );

	app.post( '/report/:reportId?/save/', reportHeaderNav, hasStartFormValues, hasCompany, parseBody, csrfProtection, reportController.save );

	app.get( '/report/:reportId/problem/', reportHeaderNav, csrfProtection, reportController.aboutProblem );
	app.post( '/report/:reportId/problem/', reportHeaderNav, parseBody, csrfProtection, reportController.aboutProblem );

	app.get( '/report/:reportId/next-steps/', reportHeaderNav, csrfProtection, reportController.nextSteps );
	app.post( '/report/:reportId/next-steps/', reportHeaderNav, parseBody, csrfProtection, reportController.nextSteps );
};
