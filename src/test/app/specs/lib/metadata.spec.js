const proxyquire = require( 'proxyquire' );
const modulePath = '../../../../app/lib/metadata';

describe( 'metadata', () => {

	let metadata;
	let backend;
	let fakeData;

	beforeEach( () => {

		fakeData = jasmine.getFakeData( '/backend/metadata/' );

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
						"id": "88cdc899-d234-43be-9221-bb667ef5a0ed",
						"name": "San Marino",
						"disabled_on": null
					},{
						"id": "1121a63c-9454-40b4-a181-bbbcc2478197",
						"name": "Dominican Republic",
						"disabled_on": null
					},{
						"id": "9c166249-4c40-4e36-b409-b596cbb4d02d",
						"name": "Tanzania",
						"disabled_on": null
					}
				] );
			} );
		} );
	} );
} );
