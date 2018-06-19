const config = require( '../config' );
const logger = require( '../lib/logger' );

module.exports = {

	handle404: function( req, res ){

		res.status( 404 );
		res.render( 'error/404' );
	},

	catchAll: function( err, req, res, next ){

		if( res.headersSent ){

			next( err );

		} else {

			if( err.code === 'TOO_MANY_BYTES' ){

				res.sendStatus( 413 );

			} else if( err.code === 'EBADCSRFTOKEN' ){

				res.status( 400 );
				res.render( 'error/invalid-csrf-token' );

			} else {

				res.status( 500 );
				res.render( 'error/default', { error: err, showErrors: config.showErrors } );
			}
		}

		logger.error( 'Something went wrong: ', err );
	}
};
