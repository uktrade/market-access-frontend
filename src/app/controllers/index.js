const backend = require( '../lib/backend-service' );
const dashboardViewModel = require( '../lib/view-models/dashboard' );

module.exports = {

	index: async ( req, res, next ) => {

		const country = req.user.country;
		const countryId = country && req.user.country.id;
		let template = 'index';
		let promise;

		if( countryId ){

			template = 'my-country';
			promise = backend.barriers.getForCountry( req, countryId );

		} else {

			promise = backend.barriers.getAll( req );
		}

		try {

			const { response, body } = await promise;

			if( response.isSuccess ){

				res.render( template, dashboardViewModel( body.results, country ) );

			} else {

				throw new Error( `Got ${ response.statusCode } response from backend` );
			}

		} catch( e ){

			next( e );
		}
	}
};
