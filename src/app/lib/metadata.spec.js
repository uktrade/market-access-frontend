const proxyquire = require( 'proxyquire' );
const modulePath = './metadata';

const getFakeData = jasmine.helpers.getFakeData;

describe( 'metadata', () => {

	let metadata;
	let backend;
	let fakeData;

	beforeEach( () => {

		fakeData = getFakeData( '/backend/metadata/' );

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
						body: fakeData
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

	describe( 'With fakeData', () => {

		beforeEach( async () => {

			backend.getMetadata.and.callFake( () => Promise.resolve( {
				response: { isSuccess: true },
				body: fakeData
			} ) );

			await metadata.fetch();
		} );

		describe( 'statusTypes', () => {
			it( 'Should return the data', () => {

				expect( metadata.statusTypes ).toEqual( fakeData.status_types );
			} );
		} );

		describe( 'lossScale', () => {
			it( 'Should return the data', () => {

				expect( metadata.lossScale ).toEqual( fakeData.loss_range );
			} );
		} );

		describe( 'boolScale', () => {
			it( 'Should return the data', () => {

				expect( metadata.boolScale ).toEqual( fakeData.adv_boolean );
			} );
		} );

		describe( 'countries', () => {
			it( 'Should return the data', () => {

				expect( metadata.countries ).toEqual( [
					{
						"id": "68496eb0-effd-42e0-91d8-349323b6fe5e",
						"name": "Saint Lucia",
						"disabled_on": null
					},
					{
						"id": "9a662aa0-99ba-4f3b-835a-859fe210e9c2",
						"name": "Senegal",
						"disabled_on": null
					}
				] );
			} );
		} );
	} );
} );
