module.exports = function( activeItem = {} ){

	const nav = {
		isDashboard: ( !!activeItem.isDashboard || false ),
		isReport: ( !!activeItem.isReport || false ),
		isFind: ( !!activeItem.isFind || false )
	};

	return function( req, res, next ){

		res.locals.headerNav = nav;
		next();
	};
};
