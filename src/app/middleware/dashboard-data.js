const urls = require( '../lib/urls' );

module.exports = ( req, res, next ) => {

	const userProfile = req.user.user_profile || {};
	const pathname = req.originalUrl.split( '?' ).shift();

	let tabs = [];

	tabs = [
		{
			text: userProfile.watchList ? userProfile.watchList.name : 'My watch list',
			href: urls.index(),
			isCurrent: pathname === urls.index(),
		},
		{
			text: 'My draft barriers',
			href: urls.reports.index(),
			isCurrent: pathname === urls.reports.index()
		}
	];

	res.locals.dashboardTabs = tabs;

	next();
};
