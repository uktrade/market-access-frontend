const config = require( '../config' );
const urls = require( '../lib/urls' );
const Form = require( '../lib/Form' );
const barrierFilters = require( '../lib/barrier-filters' );

const REPLACE = 'replace';
const NEW = 'new';
const NAME_ERROR = 'Enter a name for your watch list';

function createFilterList( filters ){

	return Object.entries( filters ).map( ( [ key, value ] ) => ({ key, value: barrierFilters.transformFilterValue( key, value ) }) );
}

module.exports = {

	save: async ( req, res, next ) => {

		const filters = barrierFilters.getFromQueryString( req.query );
		const editIndex = req.query.editList;
		const isEdit = !!editIndex;
		const watchLists = req.watchList.lists;
		const watchListsLength = watchLists.length;
		const canReplace = ( !editIndex && !!watchListsLength );
		const hasToReplace = ( watchListsLength >= config.maxWatchLists );
		let editWatchList;

		const formConfig = {
			name: {
				required: NAME_ERROR,
			}
		};

		if( isEdit ){

			const index = parseInt( editIndex, 10 );

			editWatchList = watchLists[ index ];

			if( !editWatchList ){

				return next( new Error( 'No watchlist found to edit' ) );
			}

			formConfig.name.values = [ editWatchList.name ];

		} else if( canReplace ){

			formConfig.replaceIndex = {
				type: Form.RADIO,
				items: watchLists.map( ( { name }, index ) => ({ text: name, value: index }) ),
				validators: [{
					fn: ( index ) => ( parseInt( index, 10 ) <= watchListsLength ),
					message: 'Select which watch list to replace'
				}]
			};

			if( !hasToReplace ){

				formConfig.replaceIndex.conditional = { name: 'replaceOrNew', value: REPLACE },

				formConfig.replaceOrNew = {
					type: Form.RADIO,
					items: [
						{
							html: '<strong>Replace</strong> current watch list',
							value: REPLACE,
						},{
							html: '<strong>Create new</strong> watch list',
							value: NEW,
						}
					],
					validators: [
						{
							fn: ( value ) => ( value === REPLACE || value === NEW ),
							message: 'Select to either create a new watch list or replace a current list',
						}
					]
				};
			}
		}

		const form = new Form( req, formConfig );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				const values = form.getValues();

				try {

					if( isEdit || hasToReplace || values.replaceOrNew === REPLACE ){

						await req.watchList.update( ( isEdit ? editIndex : values.replaceIndex ), values.name, filters );

					} else {

						await req.watchList.add( values.name, filters );
					}

					delete req.session.user;
					return res.redirect( urls.index() );

				} catch( e ){

					return next( e );
				}
			}
		}

		res.render( 'watch-list', {
				...form.getTemplateValues(),
				filters,
				canReplace,
				hasToReplace,
				isEdit: !!editIndex,
				queryString: req.query,
				filterList: createFilterList( filters ),
				csrfToken: req.csrfToken(),
			}
		);
	},

	rename: async ( req, res, next ) => {

		const watchListIndex = parseInt( req.params.index, 10 );
		const currentWatchList = req.watchList.lists[ watchListIndex ];

		if( !currentWatchList ){

			return next( new Error( 'Watchlist not found' ) );
		}

		const form = new Form( req, {
			name: {
				required: NAME_ERROR,
				values: [ currentWatchList.name ],
			}
		});

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				const { name } = form.getValues();

				try {

					await req.watchList.update( watchListIndex, name, currentWatchList.filters );

					delete req.session.user;
					return res.redirect( urls.index( watchListIndex ) );

				} catch( e ){

					return next( e );
				}
			}
		}

		res.render( 'watch-list', {
			...form.getTemplateValues(),
			isRename: true,
			watchListIndex,
			queryString: req.query,
			filterList: createFilterList( currentWatchList.filters ),
			csrfToken: req.csrfToken(),
		});
	},

	remove: async ( req, res, next ) => {

		try {

			const watchListIndex = parseInt( req.params.index, 10 );
			await req.watchList.remove( watchListIndex );
			delete req.session.user;

			return res.redirect( urls.index() );

		} catch( e ){

			return next( e );
		}
	}
};
