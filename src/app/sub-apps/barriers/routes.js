const csurf = require( 'csurf' );
const controller = require( './controllers' );

const fileUpload = require( './middleware/file-upload' );
const barrierIdParam = require( './middleware/params/barrier-id' );
const noteIdParam = require( './middleware/params/note-id' );
const documentIdParam = require( './middleware/params/document-id' );
const barrierTypeCategoryParam = require( './middleware/params/barrier-type-category' );
const companyIdParam = require( './middleware/params/company-id' );
const uuidParam = require( '../../middleware/params/uuid' );

const csrfProtection = csurf();

module.exports = ( express, app ) => {

	const parseBody = express.urlencoded( { extended: false } );

	app.param( 'barrierId', barrierIdParam );
	app.param( 'noteId', noteIdParam );
	app.param( 'documentId', documentIdParam );
	app.param( 'uuid', uuidParam );
	app.param( 'documentUuid', uuidParam );
	app.param( 'barrierTypeCategory', barrierTypeCategoryParam );
	app.param( 'companyId', companyIdParam );

	app.use( parseBody, csrfProtection );

	app.get( '/:barrierId/', controller.interactions.list );

	app.get( '/:barrierId/edit/', controller.edit.headlines );
	app.post( '/:barrierId/edit/', controller.edit.headlines );
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
	app.get( '/:barrierId/edit/status/', controller.edit.status );
	app.post( '/:barrierId/edit/status/', controller.edit.status );

	app.post( '/:uuid/interactions/documents/add/', fileUpload, controller.interactions.documents.add );
	app.get( '/:uuid/interactions/documents/cancel/', fileUpload, controller.interactions.documents.cancel );
	app.post( '/:uuid/interactions/documents/:id/delete/', controller.interactions.documents.delete );

	app.get( '/:barrierId/interactions/add-note/', controller.interactions.notes.add );
	app.post( '/:barrierId/interactions/add-note/', fileUpload, controller.interactions.notes.add );
	app.get( '/:barrierId/interactions/edit-note/:noteId', controller.interactions.notes.edit );
	app.post( '/:barrierId/interactions/edit-note/:noteId', fileUpload, controller.interactions.notes.edit );

	app.post( '/:uuid/interactions/notes/:noteId/documents/add/', fileUpload, controller.interactions.notes.documents.add );
	app.get( '/:uuid/interactions/notes/:noteId/documents/cancel/', fileUpload, controller.interactions.notes.documents.cancel );
	app.get( '/:uuid/interactions/notes/:noteId/documents/:id/delete/', controller.interactions.notes.documents.delete );
	app.post( '/:uuid/interactions/notes/:noteId/documents/:id/delete/', controller.interactions.notes.documents.delete );

	app.get( '/:barrierId/status/', controller.status.index );
	app.post( '/:barrierId/status/', controller.status.index );

	app.get( '/:barrierId/type/', controller.type.category );
	app.post( '/:barrierId/type/', controller.type.category );

	app.get( '/:barrierId/type/:barrierTypeCategory', controller.type.list );
	app.post( '/:barrierId/type/:barrierTypeCategory', controller.type.list );

	app.get( '/:barrierId/sectors/edit/', controller.sectors.edit );
	app.get( '/:barrierId/sectors/', controller.sectors.list );
	app.post( '/:barrierId/sectors/', controller.sectors.list );
	app.post( '/:barrierId/sectors/remove/', controller.sectors.remove );
	app.get( '/:barrierId/sectors/add/', controller.sectors.add );
	app.post( '/:barrierId/sectors/add/', controller.sectors.add );
	app.get( '/:barrierId/sectors/new/', controller.sectors.new );
	app.post( '/:barrierId/sectors/new/', controller.sectors.new );

	app.get( '/:barrierId/companies/edit/', controller.companies.edit );
	app.get( '/:barrierId/companies/', controller.companies.list );
	app.post( '/:barrierId/companies/', controller.companies.list );
	app.post( '/:barrierId/companies/remove/', controller.companies.remove );
	app.get( '/:barrierId/companies/search/', controller.companies.search );
	app.post( '/:barrierId/companies/search/', controller.companies.search );
	app.get( '/:barrierId/companies/:companyId/', controller.companies.details );
	app.post( '/:barrierId/companies/:companyId/', controller.companies.details );

	return app;
};
