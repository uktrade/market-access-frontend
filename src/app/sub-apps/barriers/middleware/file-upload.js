const formidable = require( 'formidable' );
const config = require( '../../../config' );

module.exports = ( req, res, next ) => {

	const form = new formidable.IncomingForm();

	form.maxFileSize = config.files.maxSize;

	form.parse( req, ( err, fields, files ) => {

		if( err ){

			console.log( err.message );

		} else {

			Object.assign( req.body, fields, files );
		}

		next();
	} );
};
