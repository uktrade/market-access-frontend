const backend = require( './backend-service' );

let data;

module.exports = {

	fetch: async () => {

		try {

			const { response, body } = await backend.getMetadata();

			if( response.isSuccess ){

				data = body;

			} else {

				throw new Error( 'Unable to fetch metadata' );
			}

		} catch( e ){

			throw e;
		}
	},

	get: () => data
};
