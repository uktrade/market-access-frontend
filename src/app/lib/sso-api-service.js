const sso = require( './sso-api-request' );

module.exports = {
	users: {
		//getAll: () => sso.get( `/api/v1/user/search/?autocomplete=` ),
		search: ( text ) => sso.get( `/api/v1/user/search/?autocomplete=${ encodeURIComponent( text ) }` ),
	},
};
