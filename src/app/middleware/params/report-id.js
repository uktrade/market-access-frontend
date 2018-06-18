const backend = require( '../../lib/backend-service' );
const isNumeric = /^[0-9]+$/;

module.exports = async ( req, res, next ) => {

	const reportId = req.params.reportId;

	if( reportId.length < 10 && isNumeric.test( reportId ) ){

		if( !req.session.report ){

			try {

				const { response, body } = await backend.getReport( req, reportId );

				if( response.isSuccess ){

					req.session.report = body;

				} else {

					next( new Error( 'Error response getting report' ) );
				}

			} catch( e ){

				next( e );
			}
		}

		req.report = req.session.report;
		res.locals.report = req.session.report;
		next();

	} else {

		next( new Error( 'Invalid reportId' ) );
	}
};
