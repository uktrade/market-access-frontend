module.exports = ( res, done ) => {

	const matches = /"_csrf" value="(.+?)"/.exec( res.text );

	if( matches && matches.length > 1 ){

		return matches[ 1 ];

	} else {

		done.fail();
	}
};
