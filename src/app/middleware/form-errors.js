module.exports = ( req, res, next ) => {

	req.error = ( name, text ) => {

		if( !res.locals.errors ){

			res.locals.errors = [];
		}

		res.locals.errors.push({
			href: '#' + name,
			text
		});
	};

	req.hasErrors = () => ( !!res.locals.errors && !!res.locals.errors.length );

	next();
};
