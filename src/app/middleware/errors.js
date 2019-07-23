const config = require( '../config' );

module.exports = {

	handle404: function( req, res ){

		res.status( 404 );
		res.render( 'error/404' );
	},

	catchAll: function( err, req, res, next ){

		/*
		As this middleware is called after the reporter (raven/sentry) we do not need to report errors
		If we were to call reporter.captureException here it would result it two errors being reported to Sentry
		*/

		if( res.headersSent ){

			next( err );

		} else {

			switch( err.code ){

				case 'TOO_MANY_BYTES':

					res.sendStatus( 413 );
					break;

				case 'EBADCSRFTOKEN':

					res.status( 400 );
					res.render( 'error/invalid-csrf-token' );
					break;

				case 'DOWNLOAD_FAIL':

					res.status( 500 );
					res.render( 'error/unable-to-download' );
					break;

				default:

					res.status( 500 );
					res.render( 'error/default', { error: err, showErrors: config.showErrors } );
			}
		}
	}
};
