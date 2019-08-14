const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const HttpResponseError = require( '../../../lib/HttpResponseError' );
const modulePath = './barrier-team';

describe( 'Barrier Team middleware', () => {

	let middleware;
	let get;
	let req;
	let res;
	let next;

	beforeEach( () => {

		({ req, res, next } = jasmine.helpers.mocks.middleware());

		get = jasmine.createSpy( 'backend.barriers.team.get' );
		req.barrier = {
			id: uuid(),
		};

		const backend = {
			barriers: {
				team: {
					get,
				}
			}
		};

		middleware = proxyquire( modulePath, {
			'../../../lib/backend-service': backend,
		} );
	} );

	afterEach( () => {

		expect( get ).toHaveBeenCalledWith( req, req.barrier.id );
	} );

	describe( 'When the backend rejects with an error', () => {
		it( 'Calls next with the error', async () => {

			const err = new Error( 'My test' );
			get.and.callFake( () => Promise.reject( err ) );

			await middleware( req, res, next );

			expect( next ).toHaveBeenCalledWith( err );
		} );
	} );

	describe( 'When the backend resolves without success', () => {
		it( 'Calls next with an error', async () => {

			const responseData = { response: { isSuccess: false } };
			get.and.callFake( () => Promise.resolve( responseData ) );

			await middleware( req, res, next );

			const err = next.calls.argsFor( 0 )[ 0 ];

			expect( next ).toHaveBeenCalled();
			expect( err instanceof HttpResponseError ).toEqual( true );
		} );
	} );

	describe( 'When the backend resolves with success', () => {
		it( 'Adds the members to the req and locals', async () => {

			const body = jasmine.helpers.getFakeData( '/backend/barriers/members' );
			const responseData = {
				response: { isSuccess: true },
				body
			};
			const members = body.results.map( ( member ) => {

				const { email, first_name: fname, last_name: lname } = member.user;
				let name;

				if( fname || lname ){

					name = ( `${ fname } ${ lname }` );

				} else {
					name = email.split( '@' )[ 0 ];
				}

				return {
					id: member.id,
					name,
					email,
					role: member.role,
				};
			} );

			get.and.callFake( () => Promise.resolve( responseData ) );

			await middleware( req, res, next );

			expect( next ).toHaveBeenCalledWith();
			expect( req.members ).toEqual( members );
			expect( res.locals.members ).toEqual( members );
		} );
	} );
} );
