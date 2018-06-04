const urls = require( '../lib/urls' );

module.exports = ( req, res, next ) => {

	const startFormValues = req.session.startFormValues;

	if( startFormValues && startFormValues.status && startFormValues.emergency ){

		next();

	} else {

		res.redirect( urls.report.start() );
	}
};
