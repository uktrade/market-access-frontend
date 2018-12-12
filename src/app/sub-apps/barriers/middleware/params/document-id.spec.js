const uuid = require( 'uuid/v4' );
const middleware = require( './document-id' );

describe( 'document id middelware', () => {

	let req;
	let res;
	let next;
	let documentId;

	beforeEach( () => {
		req = {
			uuid: uuid()
		};
		res = {};
		next = jasmine.createSpy( 'next' );	
	} );

	describe( 'When there is a note', () => {

		beforeEach( () => {
			
			req.note = {
				documents: [ { id: '123', } ]
			};
		} );

		describe( 'When the document id matches', () => {
			it( 'Should put the document on the request', () => {

				documentId = '1234-5678';

				const document = { id: documentId, size: 1234 };

				req.note.documents.push( document );

				middleware( req, res, next, documentId );

				expect( req.document ).toEqual( document );
				expect( next ).toHaveBeenCalledWith();
			} );
		} );
		describe( 'When the document id does NOT match', () => {
			it( 'Should call next with an error', () => {
				
				middleware( req, res, next, documentId );

				expect( next ).toHaveBeenCalledWith( new Error( `No matching document for barrier ${ req.uuid } note ${ req.note.id } and document ${ documentId }` ) );
			} );
		} );
	} );
} );
