const csurf = require( 'csurf' );
const controller = require( './controllers' );

const fileUpload = require( './middleware/file-upload' );
const barrierSession = require( './middleware/barrier-session' );
const barrierIdParam = require( './middleware/params/barrier-id' );
const noteIdParam = require( './middleware/params/note-id' );
const documentIdParam = require( './middleware/params/document-id' );
const barrierTypeCategoryParam = require( './middleware/params/barrier-type-category' );
const companyIdParam = require( './middleware/params/company-id' );
const uuidParam = require( '../../middleware/params/uuid' );
const barrierTeam = require( './middleware/barrier-team' );

const csrfProtection = csurf();

module.exports = ( express, app ) => {

	const parseBody = express.urlencoded( { extended: false } );

	app.param( 'barrierId', barrierIdParam );
	app.param( 'noteId', noteIdParam );
	app.param( 'documentId', documentIdParam );
	app.param( 'uuid', uuidParam );
	app.param( 'barrierTypeCategory', barrierTypeCategoryParam );
	app.param( 'companyId', companyIdParam );

	app.use( parseBody, csrfProtection );

	app.get( '/:barrierId/', controller.interactions.list );

	app.get( '/:barrierId/edit/title/', controller.edit.title );
	app.post( '/:barrierId/edit/title/', controller.edit.title );
	app.get( '/:barrierId/edit/product/', controller.edit.product );
	app.post( '/:barrierId/edit/product/', controller.edit.product );
	app.get( '/:barrierId/edit/description/', controller.edit.description );
	app.post( '/:barrierId/edit/description/', controller.edit.description );
	app.get( '/:barrierId/edit/source/', controller.edit.source );
	app.post( '/:barrierId/edit/source/', controller.edit.source );
	app.get( '/:barrierId/edit/priority/', controller.edit.priority );
	app.post( '/:barrierId/edit/priority/', controller.edit.priority );
	app.get( '/:barrierId/edit/eu-exit-related/', controller.edit.euExitRelated );
	app.post( '/:barrierId/edit/eu-exit-related/', controller.edit.euExitRelated );
	app.get( '/:barrierId/edit/problem-status/', controller.edit.problemStatus );
	app.post( '/:barrierId/edit/problem-status/', controller.edit.problemStatus );
	app.get( '/:barrierId/edit/status/', controller.edit.status );
	app.post( '/:barrierId/edit/status/', controller.edit.status );

	app.post( '/:uuid/interactions/documents/add/', fileUpload, controller.interactions.documents.add );
	app.get( '/:uuid/interactions/documents/cancel/', controller.interactions.documents.cancel );
	app.post( '/:uuid/interactions/documents/:id/delete/', controller.interactions.documents.delete );

	app.get( '/:barrierId/interactions/add-note/', controller.interactions.notes.add );
	app.post( '/:barrierId/interactions/add-note/', fileUpload, controller.interactions.notes.add );
	app.get( '/:barrierId/interactions/edit-note/:noteId/', controller.interactions.notes.edit );
	app.post( '/:barrierId/interactions/edit-note/:noteId/', fileUpload, controller.interactions.notes.edit );
	app.get( '/:barrierId/interactions/delete-note/:noteId/', controller.interactions.notes.delete );
	app.post( '/:barrierId/interactions/delete-note/:noteId/', controller.interactions.notes.delete );

	app.post( '/:uuid/interactions/notes/:noteId/documents/add/', fileUpload, controller.interactions.notes.documents.add );
	app.get( '/:uuid/interactions/notes/:noteId/documents/cancel/', controller.interactions.notes.documents.cancel );
	app.get( '/:uuid/interactions/notes/:noteId/documents/:id/delete/', controller.interactions.notes.documents.delete );
	app.post( '/:uuid/interactions/notes/:noteId/documents/:id/delete/', controller.interactions.notes.documents.delete );

	app.get( '/:barrierId/location/', controller.location.list );
	app.post( '/:barrierId/location/', controller.location.list );
	app.get( '/:barrierId/location/edit/', controller.location.edit );
	app.post( '/:barrierId/location/edit/', controller.location.edit );
	app.get( '/:barrierId/location/country/', controller.location.country );
	app.post( '/:barrierId/location/country/', controller.location.country );
	app.get( '/:barrierId/location/add-admin-area/', controller.location.adminAreas.add );
	app.post( '/:barrierId/location/add-admin-area/', controller.location.adminAreas.add );
	app.get( '/:barrierId/location/remove-admin-area/', controller.location.adminAreas.remove );
	app.post( '/:barrierId/location/remove-admin-area/', controller.location.adminAreas.remove );

	app.get( '/:barrierId/status/', controller.status.index );
	app.post( '/:barrierId/status/', controller.status.index );

	app.get( '/:barrierId/types/', barrierSession, controller.types.list );
	app.post( '/:barrierId/types/', barrierSession, controller.types.list );
	app.get( '/:barrierId/types/edit/', barrierSession, controller.types.edit );
	app.post( '/:barrierId/types/remove/', barrierSession, controller.types.remove );
	app.get( '/:barrierId/types/new/', barrierSession, controller.types.new );
	app.post( '/:barrierId/types/new/', barrierSession, controller.types.new );
	app.get( '/:barrierId/types/add/', barrierSession, controller.types.add );
	app.post( '/:barrierId/types/add/', barrierSession, controller.types.add );

	app.get( '/:barrierId/sectors/', barrierSession, controller.sectors.list );
	app.post( '/:barrierId/sectors/', barrierSession, controller.sectors.list );
	app.get( '/:barrierId/sectors/edit/', barrierSession, controller.sectors.edit );
	app.post( '/:barrierId/sectors/remove/', barrierSession, controller.sectors.remove );
	app.post( '/:barrierId/sectors/remove/all/', barrierSession, controller.sectors.removeAllSectors );
	app.get( '/:barrierId/sectors/add/', barrierSession, controller.sectors.add );
	app.post( '/:barrierId/sectors/add/', barrierSession, controller.sectors.add );
	app.get( '/:barrierId/sectors/add/all/', barrierSession, controller.sectors.addAllSectors );
	app.get( '/:barrierId/sectors/new/', barrierSession, controller.sectors.new );

	app.get( '/:barrierId/companies/', controller.companies.list );
	app.post( '/:barrierId/companies/', controller.companies.list );
	app.get( '/:barrierId/companies/new/', controller.companies.new );
	app.get( '/:barrierId/companies/edit/', controller.companies.edit );
	app.post( '/:barrierId/companies/remove/', controller.companies.remove );
	app.get( '/:barrierId/companies/search/', controller.companies.search );
	app.post( '/:barrierId/companies/search/', controller.companies.search );
	app.get( '/:barrierId/companies/:companyId/', controller.companies.details );
	app.post( '/:barrierId/companies/:companyId/', controller.companies.details );

	app.get( '/:barrierId/team/', barrierTeam, controller.team.list );
	app.get( '/:barrierId/team/add/', barrierTeam, controller.team.add );
	app.post( '/:barrierId/team/add/', barrierTeam, controller.team.add );
	app.get( '/:barrierId/team/add/search/', controller.team.search );
	app.post( '/:barrierId/team/add/search/', controller.team.search );
	//app.get( '/:barrierId/team/edit/:memberId', controller.team.edit );
	app.get( '/:barrierId/team/delete/:memberId', barrierTeam, controller.team.delete );
	app.post( '/:barrierId/team/delete/:memberId', barrierTeam, controller.team.delete );

	return app;
};
