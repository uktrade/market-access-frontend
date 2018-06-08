const datahub =require( '../../lib/datahub-service' );
const isValid = /^[a-zA-Z0-9-_]+$/;

module.exports = async ( req, res, next, id ) => {

	if( isValid.test( id ) ){

		try {

			const { body } = await datahub.getCompany( req, id );

			req.company = body;
			res.locals.company = body;

			next();

		} catch( e ){

			next( e );
		}

	} else {

		next( new Error( 'Invalid company id' ) );
	}
};
