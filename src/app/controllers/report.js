const urls = require( '../lib/urls' );
const datahub = require( '../lib/datahub-service' );
const viewModel = require( '../lib/view-models/report/start-form' );

module.exports = {

	index: ( req, res ) => res.render( 'report/index' ),
	start: ( req, res ) => {

		if( req.method === 'POST' ){

			const { status, emergency } = req.body;

			//TODO: validate input
			req.session.startFormValues = { status, emergency };

			res.redirect( urls.report.company() );

		} else {

			res.render( 'report/start', viewModel( req.session.startFormValues ) );
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

				} else if( response.statusCode === 404 ){

					data.error = 'No company found';

				} else {

					data.error = 'There was an error finding the company';
				}

			} catch ( e ){

				return next( e );
			}
		}

		res.render( 'report/company-search', data );
	},

	companyDetails: async ( req, res ) => res.render( 'report/company-details' )
};
