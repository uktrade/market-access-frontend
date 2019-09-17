const backend = require( '../../../../lib/backend-service' );
const { isUuid } = require( '../../../../lib/validators' );
const HttpResponseError = require( '../../../../lib/HttpResponseError' );

const maxUuidLength = 60;

module.exports = async ( req, res, next, reportId ) => {

	if( reportId === 'new' ){

		delete req.params.reportId;
		next();

	} else if( reportId.length <= maxUuidLength && isUuid( reportId ) ){

		let report = req.session.report;

		if( report ){

			// ensure we don't use stale data
			delete req.session.report;

		} else {

			try {

				const { response, body } = await backend.reports.get( req, reportId );

				if( response.isSuccess ){

					report = body;

				} else {

					next( new HttpResponseError( 'Unable to get report', response, body ) );
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
