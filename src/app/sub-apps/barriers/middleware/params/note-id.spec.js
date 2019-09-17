const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const HttpResponseError = require( '../../../../lib/HttpResponseError' );

const modulePath = './note-id';

describe( 'Note Id param middleware', () => {

	let req;
	let res;
	let next;
	let id;
	let barrierId;
	let middleware;
	let backend;

	beforeEach( () => {

		req = {};
		res = {
			locals: {},
			render: jasmine.createSpy( 'res.render' ),
			status: jasmine.createSpy( 'res.status' ),
		};
		next = jasmine.createSpy( 'next' );
		backend = {
			barriers: {
				getInteractions: jasmine.createSpy( 'backend.barriers.getInteractions' )
			}
		};

		middleware = proxyquire( modulePath, {
			'../../../../lib/backend-service': backend
		} );
	} );

	describe( 'When the id is valid', () => {

		beforeEach( () => {

			id = 123;
			barrierId = uuid();
		} );

		function check(){
			describe( 'When the response is a success', () => {
				describe( 'When the note id matches', () => {
					it( 'Should add the note to the req', async () => {

						const notes = [ { id: 456 }, { id } ];
						const promise = Promise.resolve( { response: { isSuccess: true }, body: { results: notes } } );

						backend.barriers.getInteractions.and.callFake( () => promise );

						await middleware( req, res, next, id );

						expect( backend.barriers.getInteractions ).toHaveBeenCalledWith( req, barrierId );
						expect( req.note ).toEqual( notes[ 1 ] );
						expect( next ).toHaveBeenCalledWith();
					} );
				} );

				describe( 'When the note id does NOT match', () => {
					it( 'Should call next with an error', async () => {

						const notes = [ { id: 456 } ];
						const promise = Promise.resolve( { response: { isSuccess: true }, body: { results: notes } } );

						backend.barriers.getInteractions.and.callFake( () => promise );

						await middleware( req, res, next, id );

						expect( backend.barriers.getInteractions ).toHaveBeenCalledWith( req, barrierId );
						expect( req.note ).not.toBeDefined();
						expect( next ).toHaveBeenCalledWith( new Error( `Unable to match note id ${ id } for barrier ${ barrierId }` ) );
					} );
				} );
			} );

			describe( 'When the response is NOT a success', () => {
				it( 'Should call next with an error', async () => {

					const promise = Promise.resolve( { response: { isSuccess: false, statusCode: 500 }, body: {} } );

					backend.barriers.getInteractions.and.callFake( () => promise );

					await middleware( req, res, next, id );

					expect( backend.barriers.getInteractions ).toHaveBeenCalledWith( req, barrierId );
					expect( req.note ).not.toBeDefined();
					expect( next ).toHaveBeenCalled();
					expect( next.calls.argsFor( 0 )[ 0 ] instanceof HttpResponseError ).toEqual( true );
				} );
			} );

			describe( 'When the call errors', () => {
				it( 'Should call next with the error', async () => {

					const err = new Error( 'a datahub error' );
					const promise = Promise.reject( err );

					backend.barriers.getInteractions.and.callFake( () => promise );

					await middleware( req, res, next, id );

					expect( backend.barriers.getInteractions ).toHaveBeenCalledWith( req, barrierId );
					expect( next ).toHaveBeenCalledWith( err );
				} );
			} );
		}

		describe( 'With the id in req.uuid', () => {
			beforeEach( () => {
				req.uuid = barrierId;
			} );

			check();
		} );

		describe( 'With the id in req.barrierId', () => {
			beforeEach( () => {
				req.barrier = { id: barrierId };
			} );

			check();
		} );
	} );
} );
