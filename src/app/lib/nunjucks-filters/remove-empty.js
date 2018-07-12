function removeEmpty( item ){

	if( item == null ){ return false; }

	item = String( item );

	return !!item && !!item.trim();
}

module.exports = ( input ) => {

	if( Array.isArray( input ) ){

		return input.filter( removeEmpty );
	}

	return input;
};
