const path = require( 'path' );
const jsf = require( 'json-schema-faker' );
const faker = require( 'faker/locale/en' );

const SCHEMA_PATH = '../../schema';
const REF_PATH = path.resolve( __dirname, SCHEMA_PATH );

jsf.extend( 'faker', () => faker );

module.exports = async function( path ){

	const result = require( SCHEMA_PATH + path );
	
	return jsf.resolve( result, REF_PATH );
};
