const urls = require( '../lib/urls' );

module.exports = ( req, res, next ) => {

	const startFormValues = req.session.startFormValues;

	if( startFormValues ){

		next();

	} else {

		res.redirect( urls.report.start() );
	}
};
