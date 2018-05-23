const config = require( '../config' );
const urls = require( './urls' );

module.exports = function( env ){

	env.addGlobal( 'analyticsId', config.analyticsId );
	env.addGlobal( 'feedbackLink', `${ config.datahubDomain }/support` );
	env.addGlobal( 'headerLink', `${ config.datahubDomain }/` );
	env.addGlobal( 'profileLink', `${ config.datahubDomain }/profile` );
	env.addGlobal( 'urls', urls );
};
