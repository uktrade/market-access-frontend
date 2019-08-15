const path = require( 'path' );
const writeJsonFiles = require( './_helpers/write-json-files' );
const generateSchema = require( './_helpers/generate-schema' );

const OUTPUT_PATH = path.resolve( __dirname, 'output/sso' );

const jsonFiles = {
	'user/search': generateSchema( '/sso/user-search' ),
};

writeJsonFiles( OUTPUT_PATH, jsonFiles );
