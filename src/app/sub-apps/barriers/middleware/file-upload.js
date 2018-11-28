const formidable = require( 'formidable' );
const config = require( '../../../config' );

module.exports = ( req, res, next ) => {

	const form = new formidable.IncomingForm();

	form.maxFileSize = config.files.maxSize;

	form.parse( req, ( err, fields, files ) => {

		Object.assign( req.body, fields, files );

		next();
	} );
};
