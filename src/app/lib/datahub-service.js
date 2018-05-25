const datahub = require( './datahub-request' );
//const urlParams = require( './url-params' );

module.exports = {

	getCompany: ( req, id ) => datahub.get( `/v3/company/${ id }`, req.session.ssoToken ),

	searchCompany: ( req, name, page = 1, limit = 20 ) => {
/*
		const queryParams = {
			offset: (page * limit) - limit,
			limit,
		};

		const body = {
			original_query: name,
			//uk_based: isUkBased,
			isAggregation: false
		};

		const url = `/v3/search/company?${ urlParams( queryParams ) }`;
*/
		const body = {
			name,
			offset: (page * limit) - limit,
			limit
		};

		const url = '/v3/search/company';

		return datahub.post( url, req.session.ssoToken, body );
	}
};
