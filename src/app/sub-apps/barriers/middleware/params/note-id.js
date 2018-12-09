const backend = require( '../../../../lib/backend-service' );

module.exports = async ( req, res, next, noteId ) => {

	const barrierId = ( req.barrier && req.barrier.id ) || req.uuid;

	try {

		const { response, body } = await backend.barriers.getInteractions( req, barrierId );

		if( response.isSuccess ){

			const note = body.results.find( ( note ) => note.id == noteId );

			if( note ){

				req.note = note;
				next();

			} else {

				throw new Error( `Unable to match note id ${ noteId } for barrier ${ barrierId }` );
			}

		} else {

			throw new Error( `Unable to get interactions for barrier, got ${ response.statusCode } from backend` );
		}
	} catch( e ){ next( e ); }
};
