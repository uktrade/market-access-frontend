const path = require( 'path' );
const getFile = require( './get-file' );

const DATA_FOLDER = path.resolve( __dirname, '../../../data/stubs' );

module.exports = function( file ){

	return getFile( DATA_FOLDER, file );
};
