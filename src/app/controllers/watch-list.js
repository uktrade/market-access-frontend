const config = require( '../config' );
const urls = require( '../lib/urls' );
const Form = require( '../lib/Form' );
const barrierFilters = require( '../lib/barrier-filters' );
const repoter = require( '../lib/reporter' );

const REPLACE = 'replace';
const NEW = 'new';
const NAME_ERROR = 'Enter a name for your watch list';
const MAX_CHARACTERS = config.watchList.maxNameLength;

function createFilterList( filters ){

	return Object.entries( filters ).map( ( [ key, value ] ) => ({ key, value: barrierFilters.transformFilterValue( key, value ) }) );
}

const watchListsNameValidator = {
	fn: ( text ) => {

		const length = text.length;
		const valid = ( length < MAX_CHARACTERS );

		if( !valid ){

			repoter.message( 'info', 'Watch list name too long', { characters: length } );
		}

		return valid;
	},
	message: `Enter a name less than ${ MAX_CHARACTERS } characters`,
};

module.exports = {

	save: async ( req, res, next ) => {

		const filters = barrierFilters.getFromQueryString( req.query );
		const editIndex = req.query.editList;
		const isEdit = !!editIndex;
		const watchLists = req.watchList.lists;
		const watchListsLength = watchLists.length;
		const canReplace = ( !editIndex && !!watchListsLength );
		const hasToReplace = ( watchListsLength >= config.watchList.maxLists );
		let editWatchList;

		const formConfig = {
			name: {
				required: NAME_ERROR,
				validators: [ watchListsNameValidator ],
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
				let index;

				if( hasToReplace ){

					repoter.message( 'info', 'Max number of watch lists reached' );
				}

				try {

					if( isEdit || hasToReplace || values.replaceOrNew === REPLACE ){

						index = ( isEdit ? editIndex : values.replaceIndex );
						await req.watchList.update( index, values.name, filters );

					} else {

						await req.watchList.add( values.name, filters );
						index = ( req.watchList.lists.length - 1 );
					}

					delete req.session.user;
					return res.redirect( urls.index( index ) );

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

			return next( new Error( 'Watch list not found' ) );
		}

		const form = new Form( req, {
			name: {
				required: NAME_ERROR,
				validators: [ watchListsNameValidator ],
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

			if( isNaN( watchListIndex ) ){

				throw new Error( 'Invalid watch list index' );
			}

			await req.watchList.remove( watchListIndex );
			delete req.session.user;

			return res.redirect( urls.index() );

		} catch( e ){

			return next( e );
		}
	}
};
