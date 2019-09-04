const backend = require( '../lib/backend-service' );
const viewModel = require( '../view-models/find-a-barrier' );
const barrierFilters = require( '../lib/barrier-filters' );

module.exports = {

	list: async function( req, res, next ){

		const filters = barrierFilters.getFromQueryString( req.query );
		const page = ( parseInt( req.query.page, 10 ) || 1 );

		try {

			const { response, body } = await backend.barriers.getAll( req, filters, page );

			if( response.isSuccess ){

				const editListParam = req.query.editList;
				const isEdit = !!editListParam;
				let editListIndex;
				let editList;

				if( isEdit ){

					editListIndex = parseInt( editListParam, 10 );
					editList = req.watchList.lists[ editListIndex ];
				}

				res.render( 'find-a-barrier', viewModel( {
					count: body.count,
					page,
					barriers: body.results,
					filters,
					isEdit,
					editListIndex,
					filtersMatchEditList: ( isEdit && editList && barrierFilters.areEqual( filters, editList.filters ) ),
				} ) );

			} else {

				next( new Error( `Got ${ response.statusCode } response from backend` ) );
			}

		} catch( e ) {

			next( e );
		}
	},

	download: ( req, res, next ) => {

		const filters = barrierFilters.getFromQueryString( req.query );
		const download = backend.barriers.download( req, filters );

		download.on( 'response', ( { statusCode } ) => {

			if( statusCode === 200 ){

				download.pipe( res );

			} else {

				const err = new Error( 'Unable to download data' );
				err.code = 'DOWNLOAD_FAIL';

				next( err );
			}
		} );
	},
};
