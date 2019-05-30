const urls = require( '../lib/urls' );
const backend = require( '../lib/backend-service' );
const strings = require( '../lib/strings' );
const Form = require( '../lib/Form' );
const validators = require( '../lib/validators' );

const FILTERS = Object.entries( {
	country: validators.isCountryOrAdminArea,
	sector: validators.isSector,
	type: validators.isBarrierType,
	priority: validators.isBarrierPriority,
	region: validators.isOverseasRegion,
} );

const filterStringMap = {
	country: strings.locations,
	sector: strings.sectors,
	type: strings.types,
	priority: strings.priorities,
	region: strings.regions
};

function getFilters( query ){

	const filters = {};

	for( let [ name, validator ] of FILTERS ){

		const queryValue = ( query[ name ] || '' );
		const values = ( Array.isArray( queryValue ) ? queryValue : queryValue.split( ',' ) );
		const validValues = values.filter( validator );

		if( validValues.length ){

			filters[ name ] = validValues;
		}
	}

	return filters;
}

module.exports = {

	transformFilterValue: ( key, value ) => filterStringMap[ key ]( value ),

	save: async ( req, res, next ) => {

		const filters = getFilters( req.query );
		const userProfile = req.session.user.user_profile || {};
		const filterList = Object.entries( filters ).map( ( [ key, value ] ) => ({ key, value: module.exports.transformFilterValue( key, value ) }) );

		const form = new Form( req, {
			name: {
				required: 'Enter a name for your watch list',
				values: [ userProfile.watchList ? req.session.user.user_profile.watchList.name : null ],
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

		res.render( 'watch-list/save', Object.assign(
				form.getTemplateValues(),
				{ filters, queryString: req.query, filterList, csrfToken: req.csrfToken() }
		) );
	},

	remove: async ( req, res, next ) => {

		const userProfile = req.session.user.user_profile;
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
