function removeEmpty( item ){

	item = String( item );

	return !!item && !!item.trim();
}

module.exports = ( input ) => {

	if( Array.isArray( input ) ){

		return input.filter( removeEmpty );
	}

	return input;
};
