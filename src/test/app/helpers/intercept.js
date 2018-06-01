const nock = require( 'nock' );
const config = require( '../../../app/config' );
const getFakeData = require( './get-fake-data' );

module.exports = {

	backend: () => nock( config.backend.url ),
	datahub: () => nock( config.datahub.url ),
	stub: ( file ) => getFakeData( file )
};
