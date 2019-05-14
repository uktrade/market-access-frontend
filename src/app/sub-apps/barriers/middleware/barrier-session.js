module.exports = ( req, res, next ) => {

	const id = ( req.barrier && req.barrier.id || req.uuid );

	if( !id ){

		next( new Error( 'Cannot create barrier session without an id' ) );

	} else {

		if( !req.session.barriers ){

			req.session.barriers = {};
		}

		if( !req.session.barriers[ id ] ){

			req.session.barriers[ id ] = {};
		}

		const barrierSession = req.session.barriers[ id ];

		const methods = {
			get: ( key ) => barrierSession[ key ],
			delete: ( key ) => {
				delete barrierSession[ key ];
			},
			set: ( key, value ) => {
				barrierSession[ key ] = value;
			},
			setIfNotAlready: ( key, value ) => {

				if( typeof barrierSession[ key ] === 'undefined' ){
					barrierSession[ key ] = value;
				}
			},
		};

		const createMethods = ( key ) => ({
			get: () => methods.get( key ),
			delete: () => methods.delete( key ),
			set: ( value ) => methods.set( key, value ),
			setIfNotAlready: ( value ) => methods.setIfNotAlready( key, value ),
		});

		req.barrierSession = {
			...methods,
			types: createMethods( 'types' ),
			sectors: {
				...methods,
				allSectors: createMethods( 'allSectors'),
				barrierSectors: createMethods('barrierSectors')
			},
		};

		next();
	}
};
