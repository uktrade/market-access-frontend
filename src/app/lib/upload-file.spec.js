const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid' );
const modulePath = './upload-file';

const S3_HEADER = 's3-header';
const S3_VALUE = 's3-value';

describe( 'upload file', () => {

	let uploadFile;
	let request;
	let doc;
	let url;
	let file;

	beforeEach( () => {

		url = 'www.a.com/url';
		file = {
			path: 'path/to/a/file'
		};
		request = jasmine.createSpy( 'request' );
		doc = uuid();

		const fs = {
			readFileSync: () => doc
		};

		const config = {
			files: {
				s3: {
					encryption: {
						header: S3_HEADER,
						value: S3_VALUE,
					}
				}
			}
		};

		uploadFile = proxyquire( modulePath, {
			'fs': fs,
			'request': request,
			'../config': config,
		} );
	} );

	afterEach( () => {

		expect( request.calls.argsFor( 0 )[ 0 ] ).toEqual({
			url,
			method: 'PUT',
			body: doc,
			headers: {
				[ S3_HEADER ]: S3_VALUE
			}
		});
	} );

	describe( 'When there is an error', () => {
		it( 'Should reject with the error', ( done ) => {

			const err = new Error( 'request err' );
			const promise = uploadFile( url, file );
			const cb = request.calls.argsFor( 0 )[ 1 ];

			promise.then( done.fail ).catch( ( caughtErr ) => {

				expect( caughtErr ).toEqual( err );
				done();
			} );

			cb( err );

		} );
	} );

	describe( 'When there is NOT an error', () => {
		it( 'Should call resolve with the response and body', ( done ) => {

			const response = { response: true };
			const body = { body: true };
			const promise = uploadFile( url, file );
			const cb = request.calls.argsFor( 0 )[ 1 ];

			promise.then( ( data ) => {

				expect( data.response ).toEqual( response );
				expect( data.body ).toEqual( body );
				done();

			} ).catch( done.fail );

			cb( null, response, body );
		} );
	} );
} );
