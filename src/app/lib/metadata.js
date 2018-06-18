const backend = require( './backend-service' );

module.exports.fetch = async () => {

	try {

		const { response, body } = await backend.getMetadata();

		if( response.isSuccess ){

			module.exports.statusTypes = body.status_types;
			module.exports.lossScale = body.loss_range;
			module.exports.boolScale = body.adv_boolean;

		} else {

			throw new Error( 'Unable to fetch metadata' );
		}

	} catch( e ){

		throw e;
	}
};
