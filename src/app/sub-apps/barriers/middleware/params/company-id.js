const datahub =require( '../../../../lib/datahub-service' );
const isValid = /^[a-zA-Z0-9-_]+$/;

module.exports = async ( req, res, next, id ) => {

	if( isValid.test( id ) ){

		try {

			const { response, body } = await datahub.getCompany( req, id );

			if( response.isSuccess ){

				req.company = body;
				res.locals.company = body;

				next();

			} else if( response.statusCode === 403 ){

				return res.render( 'barriers/views/data-hub-403' );

			} else {

				throw new Error( 'Not a successful response from datahub' );
			}

		} catch( e ){

			next( e );
		}

	} else {

		next( new Error( 'Invalid company id' ) );
	}
};
