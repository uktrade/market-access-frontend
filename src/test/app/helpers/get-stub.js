const path = require( 'path' );
const getFile = require( './get-file' );

const DATA_FOLDER = path.resolve( __dirname, '../../../data/stubs' );

function getStub( file ){ return getFile( DATA_FOLDER, file ); }

if( typeof jasmine !== 'undefined' ){

	jasmine.helpers = jasmine.helpers || {};

	jasmine.helpers.getStub = getStub;
}

module.exports = getStub;
