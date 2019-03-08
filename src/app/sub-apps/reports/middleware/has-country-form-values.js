const urls = require( '../../../lib/urls' );
const logger = require( '../../../lib/logger' );

module.exports = ( req, res, next ) => {

	if( req.report || req.session.countryFormValues ){

		next();

	} else {

		logger.debug( 'No countryFormValues in session, redirecting...' );
		res.redirect( urls.reports.country( req.params.reportId ) );
	}
};
