const urls = require( '../lib/urls' );
const datahub = require( '../lib/datahub-service' );

module.exports = {

	index: ( req, res ) => res.render( 'report/index' ),
	start: ( req, res ) => {

		if( req.method === 'POST' ){

			res.redirect( urls.report.company() );

		} else {

			res.render( 'report/start' );
		}
	},

	companySearch: async ( req, res, next ) => {

		const query = req.query.q;
		const data = {};

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

		res.render( 'report/company-search', data );
	},

	companyDetails: async ( req, res ) => res.render( 'report/company-details' )
};
