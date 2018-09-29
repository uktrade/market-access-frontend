module.exports = ( radioItems, data ) => {

	for( let radio of radioItems ){

		const item = data[ radio.value ];

		if( item ){

			radio.id = ( radio.id || item.id || radio.value );

			delete item.id;

			for( let[ key, value ] of Object.entries( item ) ){

				radio[ key ] = value;
			}
		}
	}

	return radioItems;
};
