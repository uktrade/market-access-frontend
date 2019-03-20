function getToken( regex, res ){

	const matches = regex.exec( res.text );

	if( matches && matches.length > 1 ){

		return matches[ 1 ];
	}
}

if( typeof jasmine !== 'undefined' ){

	jasmine.helpers = jasmine.helpers || {};

	jasmine.helpers.getCsrfToken = ( res, fail ) => {

		const token = getToken( /"_csrf" value="(.+?)"/, res );

		return token || fail( 'Could not find CSRF Token from input' );
	};

	jasmine.helpers.getCsrfTokenFromQueryParam = ( res, fail ) => {

		const token = getToken( /".+?\?.*?_csrf=([a-zA-Z0-9-]+)[&"]/, res );

		return token || fail( '"Count not find CSRF token from query string' );
	};
}
