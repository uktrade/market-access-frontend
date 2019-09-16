const datahub =require( '../../../../lib/datahub-service' );
const HttpResponseError = require( '../../../../lib/HttpResponseError' );

const isValid = /^[a-zA-Z0-9-_]+$/;

module.exports = async ( req, res, next, id ) => {

	if( isValid.test( id ) ){

		try {

			const { response, body } = await datahub.getCompany( id );

			if( response.isSuccess ){

				req.company = body;
				res.locals.company = body;

				next();

			} else {

				throw new HttpResponseError( 'Unable to get company from Data Hub', response, body );
			}

		} catch( e ){

			next( e );
		}

	} else {

		next( new Error( 'Invalid company id' ) );
	}
};
