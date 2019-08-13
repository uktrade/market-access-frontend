const nock = require( 'nock' );
const config = require( '../../../app/config' );
const getFakeData = require( './get-fake-data' );

if( typeof jasmine !== 'undefined' ){

	jasmine.helpers = jasmine.helpers || {};

	jasmine.helpers.intercept = {

		backend: () => nock( config.backend.url ),
		datahub: () => nock( config.datahub.url ),
		sso: () => nock( `${ config.sso.protocol }://${ config.sso.domain }:${ config.sso.port }` ),
		stub: ( file ) => getFakeData( file )
	};
}
