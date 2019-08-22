const path = require( 'path' );
const writeJsonFiles = require( './_helpers/write-json-files' );
const generateSchema = require( './_helpers/generate-schema' );

const OUTPUT_PATH = path.resolve( __dirname, 'output/backend' );

const jsonFiles = {
	'metadata/index': generateSchema( '/backend/metadata/index' ),
	'counts/index': generateSchema( '/backend/counts/index' ),
	'reports/index': generateSchema( '/backend/reports/index' ),
	'reports/report': generateSchema( '/backend/reports/report' ),
	'barriers/index': generateSchema( '/backend/barriers/index' ),
	'barriers/barrier': generateSchema( '/backend/barriers/barrier' ),
	'barriers/interactions': generateSchema( '/backend/barriers/interactions' ),
	'barriers/history': generateSchema( '/backend/barriers/history' ),
	'barriers/members': generateSchema( '/backend/barriers/members' ),
	'barriers/assessment': generateSchema( '/backend/barriers/assessment' ),
	'barriers/assessment_history': generateSchema( '/backend/barriers/assessment_history' ),
};

writeJsonFiles( OUTPUT_PATH, jsonFiles );
