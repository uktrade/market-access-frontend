const csurf = require( 'csurf' );

const headerNav = require( '../../middleware/header-nav' );

const controller = require( './controllers' );

const uuidParam = require( '../../middleware/params/uuid' );
const dashboardData = require( '../../middleware/dashboard-data' );
const reportId = require( './middleware/params/report-id' );

const hasStartFormValues = require( './middleware/has-start-form-values' );
const hasResolvedFormValues = require( './middleware/has-resolved-form-values' );
const hasCountryFormValues = require('././middleware/has-country-form-values');

const csrfProtection = csurf();

module.exports = ( express, app ) => {

	const parseBody = express.urlencoded( { extended: false } );

	app.param( 'uuid', uuidParam );
	app.param( 'reportId', reportId );

	app.use( parseBody, csrfProtection );

	app.get( '/', headerNav( { isDashboard: true } ), dashboardData, controller.index ),
	app.get( '/new/', controller.new );

	app.get( '/:reportId?/start/', controller.start );
	app.post( '/:reportId?/start/', controller.start );

	app.get( '/:reportId?/is-resolved/', hasStartFormValues, controller.isResolved );
	app.post( '/:reportId?/is-resolved/', hasStartFormValues, controller.isResolved );

	app.get( '/:reportId?/country/', hasStartFormValues, hasResolvedFormValues, controller.country );
	app.post( '/:reportId?/country/', hasStartFormValues, hasResolvedFormValues, controller.country );

	app.get( '/:reportId?/has-admin-areas/', hasStartFormValues, hasResolvedFormValues, hasCountryFormValues, controller.hasAdminAreas );
	app.post( '/:reportId?/has-admin-areas/', hasStartFormValues, hasResolvedFormValues, hasCountryFormValues, controller.hasAdminAreas );

	app.get( '/:reportId?/admin-areas/', hasStartFormValues, hasResolvedFormValues, hasCountryFormValues, controller.adminAreas.list );
	app.post( '/:reportId?/admin-areas/', hasStartFormValues, hasResolvedFormValues, hasCountryFormValues, controller.adminAreas.list );

	app.get( '/:reportId/admin-areas/add/', controller.adminAreas.add );
	app.post( '/:reportId/admin-areas/add/', controller.adminAreas.add );
	app.post( '/:reportId/admin-areas/remove/', controller.adminAreas.remove );

	app.get( '/:reportId/has-sectors/', controller.hasSectors );
	app.post( '/:reportId/has-sectors/', controller.hasSectors );

	app.get( '/:reportId/sectors/', controller.sectors.list );
	app.post( '/:reportId/sectors/', controller.sectors.list );

	app.get( '/:reportId/sectors/add/', controller.sectors.add );
	app.post( '/:reportId/sectors/add/', controller.sectors.add );
	app.post( '/:reportId/sectors/remove/', controller.sectors.remove );

	app.get( '/:reportId/problem/', controller.aboutProblem );
	app.post( '/:reportId/problem/', controller.aboutProblem );

	app.get( '/:reportId/summary/', controller.summary );
	app.post( '/:reportId/summary/', controller.summary );

	app.post( '/:reportId/submit/', controller.submit );

	// detail must be last route
	app.get( '/:reportId/', controller.report );

	return app;
};
