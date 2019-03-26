const urls = require( '../lib/urls' );
const backend = require( '../lib/backend-service' );
const dashboardViewModel = require( '../view-models/dashboard' );

module.exports = {

	index: async ( req, res, next ) => {

		const country = req.user.country;
		const countryId = country && req.user.country.id;
		let template = 'index';
		const filters = {
			status: '2,5'
		};

		if( countryId ){

			template = 'my-country';
			filters.country = countryId;
		}

		try {

			const { response, body } = await backend.barriers.getAll( req, filters );

			if( response.isSuccess ){

				res.render( template, dashboardViewModel( body.results, country ) );

			} else {

				throw new Error( `Got ${ response.statusCode } response from backend` );
			}

		} catch( e ){

			next( e );
		}
	},

	me: ( req, res ) => {

		if( req.method === 'POST' ){

			delete req.session.user;
			res.redirect( urls.me() );

		} else {

			res.render( 'me', { csrfToken: req.csrfToken() } );
		}
	},

	documents: {
		download: async ( req, res, next ) => {

			const documentId = req.params.uuid;

			try {

				const { response, body } = await backend.documents.download( req, documentId );

				if( response.isSuccess && body.document_url ){

					res.redirect( body.document_url );

				} else {

					next( new Error( 'Unable to get document download link' ) );
				}

			} catch( e ){

				next( e );
			}
		},
	}
};
