const backend = require( '../lib/backend-service' );
const reporter = require( '../lib/reporter' );

module.exports = async ( req, res, next ) => {

	const hasCountry = req.user && req.user.country && req.user.country.id;
	const tabs = {
		country: {
			skip: true
		},
		all: {
			skip: true
		}
	};

	let all;
	let country;
	let unfinished;
	let counts;

	try {

		const { response, body } = await backend.getCounts( req );

		if( response.isSuccess ){

			const barriers = body.barriers;
			const user = body.user;
			const reports = body.reports;

			all = ( barriers && ( ( barriers.paused || 0 ) + barriers.open ) );
			country = ( user && user.country );
			unfinished = reports;

			counts = body;

		} else {

			reporter.message( `Unable to get counts, got ${ response.statusCode } from backend` );
		}

	} catch ( e ){

		reporter.captureException( e );
	}

	if( hasCountry ){

		tabs.country = {
			skip: false,
			count: ( country && country.barriers )
		};

		unfinished = ( country && country.reports );

	} else {

		tabs.all = {
			skip: false,
			count: all
		};
	}

	tabs.unfinished = {
		skip: ( typeof unfinished === 'undefined' ? false : ( unfinished === 0 ) ),
		count: unfinished
	};

	res.locals.dashboard = {
		tabs,
		counts
	};

	next();
};
