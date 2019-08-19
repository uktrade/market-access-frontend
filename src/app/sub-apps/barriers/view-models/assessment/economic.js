const { documents: documentUrls } = require( '../../../../lib/urls' ).barriers.assessment;


module.exports = function( barrierId, documents, templateValues ){

	const values = {
		...templateValues,
		xhr: {
			upload: documentUrls.add( barrierId ),
			delete: documentUrls.delete( barrierId, ':uuid' ),
		},
	};

	if( documents ){

		values.documents = documents.map( ( document ) => ({
			...document,
			deleteUrl: documentUrls.delete( barrierId, document.id )
		}) );
	}

	return values;
};
