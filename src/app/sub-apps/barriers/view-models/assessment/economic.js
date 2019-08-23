const fileSize = require( '../../../../lib/file-size' );
const { documents: documentUrls } = require( '../../../../lib/urls' ).barriers.assessment;


module.exports = function( barrierId, sessionDocuments, templateValues ){

	const values = {
		...templateValues,
		xhr: {
			upload: documentUrls.add( barrierId ),
			delete: documentUrls.delete( barrierId, ':uuid' ),
		},
	};

	if( sessionDocuments ){

		values.documents = sessionDocuments.map( ( document ) => ({
			...document,
			size: fileSize( document.size ),
			deleteUrl: documentUrls.delete( barrierId, document.id )
		}) );
	}

	return values;
};
