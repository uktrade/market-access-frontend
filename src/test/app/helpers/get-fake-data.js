const path = require( 'path' );
const getFile = require( './get-file' );

const DATA_FOLDER = path.resolve( __dirname, '../fake-data/' );

function getFakeData( file ){

	return getFile( DATA_FOLDER, file );
}

module.exports = getFakeData;

if( typeof jasmine !== 'undefined' ){

	jasmine.getFakeData = getFakeData;
}
