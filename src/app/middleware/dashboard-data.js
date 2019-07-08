const urls = require( '../lib/urls' );
const config = require( '../config' );

module.exports = ( req, res, next ) => {

	const watchLists = req.watchList.lists;
	const pathname = req.originalUrl.split( '?' ).shift();

	let tabs = [];

	tabs = [
		{
			text: watchLists.length ? watchLists[ 0 ].name : 'My watch list',
			href: urls.index(),
			isCurrent: pathname === urls.index(),
		},
		{
			text: 'My draft barriers',
			href: urls.reports.index(),
			isCurrent: pathname === urls.reports.index()
		}
	];

	res.locals.dashboardData = {
		tabs,
		canAddWatchList: ( watchLists.length <= config.maxWatchLists ),
	};

	next();
};
