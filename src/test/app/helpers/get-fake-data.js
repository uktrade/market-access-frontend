const path = require( 'path' );

const DATA_FOLDER = path.resolve( __dirname, '../fake-data/' );

module.exports = function( file ){

	if( file.substr( -1 ) === '/' ){

		file += 'index';
	}

	const fileWithExt = ( file + '.json' );
	const data = require( DATA_FOLDER + fileWithExt );

	try {

		// convert to string and back to JSON to ensure it's clean data
		return JSON.parse( JSON.stringify( data ) );

	} catch ( e ){

		console.error( 'Unable to transform JSON for file: %s', fileWithExt );
		console.error( e );
	}
};
