module.exports = ( res, fail ) => {

	const matches = /"_csrf" value="(.+?)"/.exec( res.text );

	if( matches && matches.length > 1 ){

		return matches[ 1 ];

	} else {

		fail();
	}
};
