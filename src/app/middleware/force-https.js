module.exports = function( isSecure ){

	return function( req, res, next ){

		const header = req.headers[ 'x-forwarded-proto' ];

		if( isSecure && typeof header !== 'undefined' && header !== 'https' ){

			res.redirect( [ 'https://', req.get( 'Host' ), req.url ].join( '' ) );

		} else {

			next();
		}
	};
};
