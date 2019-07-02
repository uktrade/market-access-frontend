const urls = require( '../lib/urls' );
const backend = require( '../lib/backend-service' );
const Form = require( '../lib/Form' );
const barrierFilters = require( '../lib/barrier-filters' );

module.exports = {

	save: async ( req, res, next ) => {

		const filters = barrierFilters.getFromQueryString( req.query );
		const isRename = ( req.query.rename === 'true' );
		const userProfile = req.user.user_profile || {};
		const filterList = Object.entries( filters ).map( ( [ key, value ] ) => ({ key, value: barrierFilters.transformFilterValue( key, value ) }) );

		const form = new Form( req, {
			name: {
				required: 'Enter a name for your watch list',
				values: [ userProfile.watchList ? userProfile.watchList.name : null ],
			}
		} );

		if ( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				const watchList = {
					name: form.getValues().name,
					filters
				};

				userProfile.watchList = watchList;

				try {

					const { response } = await backend.watchList.save( req, userProfile );

					if( response.isSuccess ){

						delete req.session.user;
						return res.redirect( urls.index() );

					} else {

						next( new Error( `Unable to save watch list, got ${ response.statusCode } response code` ) );
					}

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
				showWarning: ( isRename ? false : !!userProfile.watchList ),
			}
		);
	},

	remove: async ( req, res, next ) => {

		const userProfile = req.user.user_profile;
		userProfile.watchList = null;

		try {

			const { response } = await backend.watchList.save( req, userProfile );

			if( response.isSuccess ){

				delete req.session.user;
				return res.redirect( urls.index() );

			} else {

				next( new Error( `Unable to get user info, got ${ response.statusCode } response code` ) );
			}

		} catch( e ){

			return next( e );
		}
	}
};
