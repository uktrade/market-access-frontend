function getFile( folder, file ){

	if( file.substr( -1 ) === '/' ){

		file += 'index';
	}

	const fileWithExt = ( file + '.json' );
	const data = require( folder + fileWithExt );

	try {

		// convert to string and back to JSON to ensure it's clean data
		return JSON.parse( JSON.stringify( data ) );

	} catch ( e ){

		console.error( 'Unable to transform JSON for file: %s', fileWithExt );
		console.error( e );
	}
}

if( typeof jasmine !== 'undefined' ){

	jasmine.helpers = jasmine.helpers || {};

	jasmine.helpers.getFile = getFile;
}

module.exports = getFile;
