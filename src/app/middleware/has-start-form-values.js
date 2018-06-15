const urls = require( '../lib/urls' );
const logger = require( '../lib/logger' );

module.exports = ( req, res, next ) => {

	const startFormValues = req.session.startFormValues;

	if( req.barrier || startFormValues ){

		next();

	} else {
		logger.debug( 'No startFormValues in session, redirecting...' );
		res.redirect( urls.report.start( req.params.barrierId ) );
	}
};
