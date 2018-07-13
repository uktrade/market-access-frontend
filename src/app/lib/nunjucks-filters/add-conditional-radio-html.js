module.exports = ( radioItems, data ) => {

	for( let radio of radioItems ){

		const item = data[ radio.value ];

		if( item ){

			radio.id = ( radio.id || item.id || radio.value );
			radio.conditional = { html: item.html };
		}
	}

	return radioItems;
};
