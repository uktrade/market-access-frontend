const proxyquire = require( 'proxyquire' );
const modulePath = '../../../../app/lib/metadata';

describe( 'metadata', () => {

	let metadata;
	let backend;

	beforeEach( () => {

		backend = {
			getMetadata: jasmine.createSpy( 'backend.getMetadata' )
		};

		metadata = proxyquire( modulePath, {
			'./backend-service': backend
		} );
	} );

	describe( 'fetch', () => {

		describe( 'Without an error', () => {

			describe( 'A successful response', () => {

				it( 'Should report no errors', async () => {

					backend.getMetadata.and.callFake( () => Promise.resolve( {
						response: { isSuccess: true },
						body: { data: true }
					} ) );

					await metadata.fetch();
				} );
			} );

			describe( 'An unsuccessful response', () => {

				it( 'Should throw an error', async () => {

					backend.getMetadata.and.callFake( () => Promise.resolve( {
						response: { isSuccess: false }
					} ) );

					try {

						await metadata.fetch();

					} catch( e ){

						expect( e ).toEqual( new Error( 'Unable to fetch metadata' ) );
					}
				} );
			} );
		} );

		describe( 'With an error', () => {

			it( 'Should throw the error', async () => {

				const theErr = new Error( 'test' );

				backend.getMetadata.and.callFake( () => { throw theErr; } );

				try {

					await metadata.fetch();

				} catch( e ){

					expect( e ).toEqual( theErr );
				}
			} );
		} );
	} );

	describe( 'get', () => {

		it( 'Should return the data', async () => {

			const theData = { some: 'data' };

			backend.getMetadata.and.callFake( () => Promise.resolve( {
				response: { isSuccess: true },
				body: theData
			} ) );

			await metadata.fetch();

			expect( metadata.get() ).toEqual( theData );
		} );
	} );
} );
