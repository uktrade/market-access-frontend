const csurf = require( 'csurf' );

const headerNav = require( '../../middleware/header-nav' );

const controller = require( './controllers' );

const uuidParam = require( '../../middleware/params/uuid' );
const dashboardData = require( '../../middleware/dashboard-data' );
const reportId = require( './middleware/params/report-id' );
const countryId = require( './middleware/params/country-id' );

const hasStartFormValues = require( './middleware/has-start-form-values' );
const hasResolvedFormValues = require( './middleware/has-resolved-form-values' );

const csrfProtection = csurf();

module.exports = ( express, app ) => {

	const parseBody = express.urlencoded( { extended: false } );

	app.param( 'uuid', uuidParam );
	app.param( 'reportId', reportId );
	app.param( 'countryId', countryId);

	app.use( parseBody, csrfProtection );

	app.get( '/', headerNav( { isDashboard: true } ), dashboardData, controller.index ),
	app.get( '/new/', controller.new );

	app.get( '/:reportId?/start/', controller.start );
	app.post( '/:reportId?/start/', controller.start );

	app.get( '/:reportId?/is-resolved/', hasStartFormValues, controller.isResolved );
	app.post( '/:reportId?/is-resolved/', hasStartFormValues, controller.isResolved );

	app.get( '/:reportId?/country/', hasStartFormValues, hasResolvedFormValues, controller.country );
	app.post( '/:reportId?/country/', hasStartFormValues, hasResolvedFormValues, controller.country );

	app.get( '/:reportId?/country/:countryId/has-admin-areas/', hasStartFormValues, hasResolvedFormValues, controller.hasAdminAreas );
	app.post( '/:reportId?/country/:countryId/has-admin-areas/', hasStartFormValues, hasResolvedFormValues, controller.hasAdminAreas );

	app.get( '/:reportId?/country/:countryId/admin-areas/', hasStartFormValues, hasResolvedFormValues, controller.adminAreas.list );
	app.post( '/:reportId?/country/:countryId/admin-areas/', hasStartFormValues, hasResolvedFormValues, controller.adminAreas.list );

	app.get( '/:reportId/country/:countryId/admin-areas/add/', controller.adminAreas.add );
	app.post( '/:reportId/country/:countryId/admin-areas/add/', controller.adminAreas.add );
	app.post( '/:reportId/country/:countryId/admin-areas/remove/', controller.adminAreas.remove );

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

	app.get( '/:reportId/delete/', headerNav( { isDashboard: true } ), dashboardData, controller.delete ),
	app.post( '/:reportId/delete/', headerNav( { isDashboard: true } ), dashboardData, controller.delete ),

	// detail must be last route
	app.get( '/:reportId/', controller.report );

	return app;
};
