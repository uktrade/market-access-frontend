const ssoController = require( './controllers/sso' );
const indexController = require( './controllers/index' );
const reportController = require( './controllers/report' );
const headerNav = require( './middleware/header-nav' );
const user = require( './middleware/user' );
const urls = require( './lib/urls' );

const reportHeaderNav = headerNav( { isReport: true } );

module.exports = function( express, app ){

	const companySearchBodyParser = express.urlencoded( {
		extended: false,
		limit: '0.5kb', // ~500 characters
		parameterLimit: 2 // q and csrftoken
	} );

	app.get( '/login/', ssoController.authRedirect );
	app.get( '/login/callback/', ssoController.callback );

	app.use( user );
	
	app.get( urls.index(), headerNav( { isDashboard: true } ), indexController );
	app.get( urls.report.index(), reportHeaderNav, reportController.index );
	app.get( urls.report.start(), reportHeaderNav, reportController.start );
	app.post( urls.report.start(), reportHeaderNav, reportController.start );
	app.get( urls.report.company(), reportHeaderNav, reportController.companySearch );
	// TODO: Add csrftoken
	app.post( urls.report.company(), reportHeaderNav, companySearchBodyParser, reportController.companySearch );
};
