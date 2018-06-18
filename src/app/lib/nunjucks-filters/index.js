module.exports = function( env ){

	env.addFilter( 'highlight', require( './highlight' ) );
	env.addFilter( 'removeEmpty', require( './remove-empty' ) );
	env.addFilter( 'dateOnly', require( './date-only' ) );
	env.addFilter( 'dateWithTime', require( './date-with-time' ) );
};
