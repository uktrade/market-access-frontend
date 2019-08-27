module.exports = ( value ) => {

	const type = typeof value;

	if( type === 'string' && value ){

		value = Number( value );

	} else if( type !== 'number' ){

		return value;
	}

	return value.toLocaleString();
};
