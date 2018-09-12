const urls = require( '../../../lib/urls' );
const logger = require( '../../../lib/logger' );

module.exports = ( req, res, next ) => {

	if( req.report || req.session.isResolvedFormValues ){

		next();

	} else {

		logger.debug( 'No isResolvedFormValues in session, redirecting...' );
		res.redirect( urls.reports.isResolved( req.params.reportId ) );
	}
};
