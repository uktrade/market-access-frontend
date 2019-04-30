const urls = require( '../lib/urls' );
const backend = require( '../lib/backend-service' );
const { OPEN, HIBERNATED } = require( '../lib/metadata' ).barrier.status.types;
const dashboardViewModel = require( '../view-models/dashboard' );

const sortableFields = [ 'priority', 'date', 'location', 'status' ];
const sortDirections = [ 'asc', 'desc' ];

function getSort( { sortBy, sortDirection } ){

	return {
		sortBy: ( sortableFields.includes( sortBy ) ? sortBy : 'reported_on' ),
		sortDirection: ( sortDirections.includes( sortDirection ) ? sortDirection : 'desc' ),
	};
}

module.exports = {

	index: async ( req, res, next ) => {

		const country = req.user.country;
		const countryId = country && req.user.country.id;
		const filters = {
			status: [ OPEN, HIBERNATED ].join( ',' ),
		};
		const { sortBy, sortDirection } = getSort( req.query );
		let template = 'index';

		if( countryId ){

			template = 'my-country';
			filters.country = countryId;
		}

		try {

			const { response, body } = await backend.barriers.getAll( req, filters, sortBy, sortDirection );

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
