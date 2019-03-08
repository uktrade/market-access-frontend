module.exports = {

	highlight: ( str, words ) => {

		if( !words ){ return str; }

		const queryWords = words.split( ' ' ).filter( ( word ) => word.length >= 1 );
		const openTag = '<span class=\'highlight\'>';
		const closeTag = '</span>';

		queryWords.forEach( ( word ) => {
			const query = new RegExp(`(${word})(?![^<]+?>)`, 'ig');
			str = str.replace( query, ( matchedTxt ) => ( openTag + matchedTxt + closeTag ) );
		});

		return str;
	}
};
