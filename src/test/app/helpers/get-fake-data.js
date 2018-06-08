const path = require( 'path' );
const getFile = require( './get-file' );

const DATA_FOLDER = path.resolve( __dirname, '../fake-data/' );

module.exports = function( file ){

	return getFile( DATA_FOLDER, file );
};
