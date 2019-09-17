const backend = require( '../../../../lib/backend-service' );
const { isUuid } = require( '../../../../lib/validators' );
const HttpResponseError = require( '../../../../lib/HttpResponseError' );
const urls = require( '../../../../lib/urls' );

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

					const err = new HttpResponseError( 'Unable to get report', response, body );

					if( response.statusCode === 404 ){

						const barrierRequest = await backend.barriers.get( req, reportId );

						if( barrierRequest.response.isSuccess ){

							return res.redirect( urls.barriers.detail( reportId ) );

						} else {

							err.code = 'REPORT_NOT_FOUND';
						}
					}

					return next( err );
				}

			} catch( e ){

				return next( e );
			}
		}

		req.report = report;
		res.locals.report = report;
		next();

	} else {

		next( new Error( 'Invalid reportId' ) );
	}
};
