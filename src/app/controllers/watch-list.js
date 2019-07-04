const urls = require( '../lib/urls' );
const Form = require( '../lib/Form' );
const barrierFilters = require( '../lib/barrier-filters' );

module.exports = {

	save: async ( req, res, next ) => {

		const filters = barrierFilters.getFromQueryString( req.query );
		const isRename = ( req.query.rename === 'true' );
		const currentWatchListIndex = 0;
		const currentWatchList = req.watchList.lists[ currentWatchListIndex ];
		const filterList = Object.entries( filters ).map( ( [ key, value ] ) => ({ key, value: barrierFilters.transformFilterValue( key, value ) }) );

		const form = new Form( req, {
			name: {
				required: 'Enter a name for your watch list',
				values: [ currentWatchList ? currentWatchList.name : null ],
			}
		} );

		if ( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				try {

					if( req.watchList.lists.length ){

						await req.watchList.update( currentWatchListIndex, form.getValues().name, filters );

					} else {

						await req.watchList.add( form.getValues().name, filters );
					}
					delete req.session.user;
					return res.redirect( urls.index() );

				} catch( e ){

					return next( e );
				}
			}
		}

		res.render( 'watch-list/save', {
				...form.getTemplateValues(),
				filters,
				isRename,
				queryString: req.query,
				filterList,
				csrfToken: req.csrfToken(),
				showWarning: ( isRename ? false : !!currentWatchList ),
			}
		);
	},

	remove: async ( req, res, next ) => {

		try {

			const currentWatchListIndex = 0;
			await req.watchList.remove( currentWatchListIndex );
			delete req.session.user;

			return res.redirect( urls.index() );

		} catch( e ){

			return next( e );
		}
	}
};
