const config = require( '../config' );
const datahub = config.datahub.stub ? require( './datahub-request.stub' ) : require( './datahub-request' );

module.exports = {

	getCompany: ( id ) => datahub.get( `/v4/public/company/${ id }` ),

	searchCompany: ( query, page = 1, limit = 20 ) => {

		const body = {
			original_query: query,
			offset: (page * limit) - limit,
			limit,
		};

		//const url = '/v3/activity-stream/'; // generate a 403
		const url = '/v4/public/search/company';

		return datahub.post( url, body );
	},
};
