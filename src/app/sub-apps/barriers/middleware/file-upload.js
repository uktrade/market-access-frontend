const formidable = require( 'formidable' );
const config = require( '../../../config' );
const reporter = require( '../../../lib/reporter' );

module.exports = ( req, res, next ) => {

	const form = new formidable.IncomingForm();

	form.maxFileSize = config.files.maxSize;

	form.on( 'error', reporter.captureException );

	form.parse( req, ( err, fields, files ) => {

		Object.assign( req.body, fields );

		if( err ){

			req.formError = err;

		} else {

			Object.assign( req.body, files );
		}

		next();
	} );
};
