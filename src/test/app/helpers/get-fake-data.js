const path = require( 'path' );
const getFile = require( './get-file' );

const DATA_FOLDER = path.resolve( __dirname, '../fake-data/' );

function getFakeData( file ) { return getFile( DATA_FOLDER, file ); }

if( typeof jasmine !== 'undefined' ){

	jasmine.helpers = jasmine.helpers || {};

	jasmine.helpers.getFakeData = getFakeData;
}

module.exports = getFakeData;
