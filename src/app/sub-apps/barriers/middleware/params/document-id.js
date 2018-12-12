
module.exports = ( req, res, next, documentId ) => {

	const { note } = req;
	const document = note.documents && note.documents.find( ( doc ) => doc.id === documentId );

	if( document ){

		req.document = document;
		next();

	} else {

		next( new Error( `No matching document for barrier ${ req.uuid } note ${ note.id } and document ${ documentId }` ) );
	}
};
