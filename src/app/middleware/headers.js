/* eslint quotes: 0 */
const cspValues = [

	`default-src 'none'`,
	`base-uri 'self'`,
	`script-src 'self' 'unsafe-inline' www.google-analytics.com www.googletagmanager.com`,
	`style-src 'self' 'unsafe-inline'`,
	`font-src 'self'`,
	`img-src 'self' data: www.google-analytics.com`,
	`form-action 'self'`,
	`connect-src 'self'`

].join( ';' );

const cspValuesWithEval = cspValues.replace( 'script-src ', `script-src 'unsafe-eval' ` );

module.exports = function( isDev ){

	return function( req, res, next ){

		const isFindABarrier = req.url.includes( '/find-a-barrier' );

		res.setHeader( 'X-Download-Options', 'noopen' );
		res.setHeader( 'X-XSS-Protection', '1; mode=block' );
		res.setHeader( 'X-Content-Type-Options', 'nosniff' );
		res.setHeader( 'X-Frame-Options', 'deny' );
		res.setHeader( 'Content-Security-Policy', ( isFindABarrier ? cspValuesWithEval : cspValues ) );
		res.setHeader( 'Cache-Control', 'no-cache, no-store' );

		if( !isDev ){

			res.setHeader( 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains' );
		}

		next();
	};
};
