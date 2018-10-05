//const backend = require( '../lib/backend-service' );

module.exports = ( req, res, next ) => {

	//try {

		//const { response, body } = await backend.barriers.getCount( req );

		const hasCountry = req.user && req.user.country && req.user.country.id;
		const tabs = {};
		const allBarriers = 1; //( response.isSuccess && body.count ) || 0;
		const countryBarriers = 2;
		const unfinishedReports = 3; // for all countries if country (or regions if region)

		if( hasCountry ){

			tabs.country = {
				count: countryBarriers
			};

		} else {

			tabs.all = {
				count: allBarriers
			};
		}

		tabs.unfinished = {
			count: unfinishedReports
		};

		res.locals.tabData = tabs;

		next();

	//} catch ( e ){

	//	next();
	//}
};
