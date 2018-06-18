module.exports = ( obj ) => {

	const items = [];

	for( let [ key, value ] of Object.entries( obj ) ){

		items.push( {
			value: key,
			text: value
		} );
	}

	return items;
};
