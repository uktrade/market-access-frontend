module.exports = ( input, match ) => {

	if( match && typeof input === 'string' ){

		const regex = new RegExp( '(' + match + ')', 'gi' );

		return input.replace( regex, '<span class="highlight">$1</span>' );
	}

	return input;
};
