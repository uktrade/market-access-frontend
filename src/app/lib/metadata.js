const backend = require( './backend-service' );

function notDisabled( item ){

	return  item.disabled_on === null;
}

module.exports.fetch = async () => {

	try {

		const { response, body } = await backend.getMetadata();

		if( response.isSuccess ){

			module.exports.statusTypes = body.status_types;
			module.exports.lossScale = body.loss_range;
			module.exports.boolScale = body.adv_boolean;
			module.exports.countries = body.countries.filter( notDisabled );

		} else {

			throw new Error( 'Unable to fetch metadata' );
		}

	} catch( e ){

		throw e;
	}
};
