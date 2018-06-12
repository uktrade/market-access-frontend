module.exports = ( req, res, next ) => {

	res.locals.barrierId = req.params.barrierId;
	next();
};
