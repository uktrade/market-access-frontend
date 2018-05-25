const datahub = require( '../lib/datahub-service' );

module.exports = {
	index: ( req, res ) => res.render( 'report/index' ),
	start: ( req, res ) => res.render( 'report/start' ),
	companySearch: async ( req, res, next ) => {

		const data = {};

		if( req.method === 'POST' ){

			const query = ( req.body && req.body.query );

			if( query ){

				data.query = query;

				try {

					const { response, body } = await datahub.searchCompany( req, query );

					if( response.isSuccess ){

						data.results = body;
					}

				} catch ( e ){

					return next( e );
				}
			}
		}

		res.render( 'report/company-search', data );
	}
};
