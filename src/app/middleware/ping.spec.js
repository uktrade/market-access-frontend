const proxyquire = require( 'proxyquire' );
const modulePath = './ping';

describe( 'ping', () => {

	let backend;
	let req;
	let res;
	let next;
	let middleware;

	beforeEach( () => {

		req = {};
		res = {
			status: jasmine.createSpy( 'res.status' ),
			send: jasmine.createSpy( 'res.send' ),
			set: jasmine.createSpy( 'res.set' )
		};
		next = jasmine.createSpy( 'next' );

		backend = {
			ping: jasmine.createSpy( 'backend.ping' )
		};

		middleware = proxyquire( modulePath, {
			'../lib/backend-service': backend
		} );
	} );

	describe( 'When the url matches', () => {

		let contentType;
		let statusCode;
		let body;

		beforeEach( () => {

			req.url = '/ping/';
		} );

		async function check(){

			const headers = {};

			if( contentType ){

				headers[ 'content-type' ] = contentType;
			}

			backend.ping.and.callFake( () => Promise.resolve( {
				response: { statusCode, headers },
				body
			} ) );

			await middleware( req, res, next );

			expect( backend.ping ).toHaveBeenCalledWith();
			expect( res.status ).toHaveBeenCalledWith( statusCode );
			expect( res.send ).toHaveBeenCalledWith( body );
			expect( next ).not.toHaveBeenCalled();
		}

		describe( 'When the backend returns 200', () => {

			beforeEach( () => {

				statusCode = 200;
				body = '<?xml version="1.0" encoding="UTF-8"?><pingdom_http_custom_check><status>OK</status></pingdom_http_custom_check>';
			} );

			describe( 'When the content type is missing', () => {
				it( 'Should not set the content type', async () => {

					await check();
					expect( res.set ).not.toHaveBeenCalled();
				} );
			} );

			describe( 'When the content type is text/xml', () => {
				it( 'Should set the content type and return the response code and body', async () => {

					contentType = 'text/xml';

					await check();

					expect( res.set ).toHaveBeenCalledWith( 'Content-Type', contentType );
				} );
			} );
		} );

		describe( 'When the backend returns a 500', () => {
			it( 'Should return the response code and body', async () => {

				contentType = 'text/xml';
				statusCode = 500;
				body = '<?xml version="1.0" encoding="UTF-8"?><pingdom_http_custom_check><status>FALSE</status></pingdom_http_custom_check><!--Something is wrong-->';

				await check( 'text/xml' );
				expect( res.set ).toHaveBeenCalledWith( 'Content-Type', contentType );
			} );
		} );
	} );

	describe( 'When the url does not match', () => {
		it( 'Should call next', () => {

			middleware( req, res, next );

			expect( res.status ).not.toHaveBeenCalled();
			expect( res.send ).not.toHaveBeenCalled();
			expect( res.set ).not.toHaveBeenCalled();
			expect( next ).toHaveBeenCalledWith();
		} );
	} );
} );
