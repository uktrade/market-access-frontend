const urls = require( '../../../lib/urls' );
const logger = require( '../../../lib/logger' );

module.exports = ( req, res, next ) => {

	if( req.session.typeCategoryValues ){

		next();

	} else {

		logger.debug( 'No typeCategoryValues in session, redirecting...' );
		res.redirect( urls.reports.type( req.params.reportId ) );
	}
};
