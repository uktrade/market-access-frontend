const path = require( 'path' );
const writeJsonFiles = require( './_helpers/write-json-files' );
const generateSchema = require( './_helpers/generate-schema' );

const OUTPUT_PATH = path.resolve( __dirname, 'output/dathub' );

const jsonFiles = {
	'company/detail': generateSchema( '/datahub/company/detail' ),
	'contact/detail': generateSchema( '/datahub/contact/detail' ),
	'search/company': generateSchema( '/datahub/search/company' ),
};

writeJsonFiles( OUTPUT_PATH, jsonFiles );
