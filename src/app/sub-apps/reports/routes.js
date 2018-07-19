const csurf = require( 'csurf' );

const headerNav = require( '../../middleware/header-nav' );

const controller = require( './controllers' );

const companyId = require( './middleware/params/company-id' );
const contactId = require( './middleware/params/contact-id' );
const reportId = require( './middleware/params/report-id' );

const hasStartFormValues = require( './middleware/has-start-form-values' );
const hasCompany = require( './middleware/has-company' );

const csrfProtection = csurf();

module.exports = ( express, app ) => {

	const parseBody = express.urlencoded( { extended: false } );

	app.param( 'companyId', companyId );
	app.param( 'contactId', contactId );
	app.param( 'reportId', reportId );

	app.use( parseBody, csrfProtection );

	app.get( '/', headerNav( { isDashboard: true } ), controller.index ),
	app.get( '/new/', controller.new );
	app.get( '/new/success/', controller.success );

	app.get( '/:reportId?/start/', controller.start );
	app.post( '/:reportId?/start/', controller.start );

	app.get( '/:reportId?/company/', hasStartFormValues, controller.companySearch );
	app.get( '/:reportId?/company/:companyId', hasStartFormValues, controller.companyDetails );
	app.post( '/:reportId?/company/', hasStartFormValues, controller.companyDetails );

	app.get( '/:reportId?/company/:companyId/contacts/', hasStartFormValues, hasCompany, controller.contacts );
	app.get( '/:reportId?/contact/:contactId', hasStartFormValues, hasCompany, controller.contactDetails );

	app.post( '/:reportId?/save/', hasStartFormValues, hasCompany, controller.save );

	app.get( '/:reportId/problem/', controller.aboutProblem );
	app.post( '/:reportId/problem/', controller.aboutProblem );

	app.get( '/:reportId/impact/', controller.impact );
	app.post( '/:reportId/impact/', controller.impact );

	app.get( '/:reportId/legal/', controller.legal );
	app.post( '/:reportId/legal/', controller.legal );

	app.get( '/:reportId/type/', controller.type );
	app.post( '/:reportId/type/', controller.type );

	app.get( '/:reportId/support/', controller.support );
	app.post( '/:reportId/support/', controller.support );

	app.get( '/:reportId/next-steps/', controller.nextSteps );
	app.post( '/:reportId/next-steps/', controller.nextSteps );

	app.post( '/:reportId/submit/', controller.submit );
	// detail muse be last route
	app.get( '/:reportId/', controller.report );

	return app;
};
