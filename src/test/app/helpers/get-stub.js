const path = require( 'path' );
const getFile = require( './get-file' );

const DATA_FOLDER = path.resolve( __dirname, '../../../data/stubs' );

function getStub( file ){

	return getFile( DATA_FOLDER, file );
}

module.exports = getStub;

if( typeof jasmine !== 'undefined' ){

	jasmine.getStub = getStub;
}
