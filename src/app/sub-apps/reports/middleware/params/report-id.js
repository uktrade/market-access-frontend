const backend = require( '../../../../lib/backend-service' );
const isNumeric = /^[0-9]+$/;

module.exports = async ( req, res, next ) => {

	const reportId = req.params.reportId;

	if( reportId === 'new' ){

		delete req.params.reportId;
		next();

	} else if( reportId.length < 10 && isNumeric.test( reportId ) ){

		let report = req.session.report;

		if( report ){

			// ensure we don't use stale data
			delete req.session.report;

		} else {

			try {

				const { response, body } = await backend.getReport( req, reportId );

				if( response.isSuccess ){

					report = body;

				} else {

					next( new Error( 'Error response getting report' ) );
				}

			} catch( e ){

				next( e );
			}
		}

		req.report = report;
		res.locals.report = report;
		next();

	} else {

		next( new Error( 'Invalid reportId' ) );
	}
};
