const config = require( '../config' );
const urls = require( './urls' );

module.exports = function( env ){

	env.addGlobal( 'analytics', config.analytics );
	env.addGlobal( 'feedbackLink', `${ config.datahubDomain }/support` );
	env.addGlobal( 'headerLink', `${ config.datahubDomain }/` );
	env.addGlobal( 'profileLink', `${ config.datahubDomain }/profile` );
	env.addGlobal( 'urls', urls );
	env.addGlobal( 'showErrors', config.isDev );
	env.addGlobal( 'feedbackEmail', config.feedbackEmail );
};
