const urls = require( '../lib/urls' );
const logger = require( '../lib/logger' );

module.exports = ( req, res, next ) => {

	if( req.barrier || req.session.reportCompany ){

		next();

	} else {

		logger.debug( 'No reportCompany in session, redirecting...' );
		res.redirect( urls.report.companySearch( req.params.barrierId ) );
	}
};
