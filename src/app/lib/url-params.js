module.exports = function urlParams( params ){

	const arr = [];

	for( let paramKey in params ){

		arr.push( `${ paramKey }=${ encodeURIComponent( params[ paramKey ] ) }` );
	}

	return arr.join( '&' );
};
