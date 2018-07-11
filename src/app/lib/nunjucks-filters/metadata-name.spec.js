const proxyquire = require( 'proxyquire' );
const modulePath = './metadata-name';

let metadataName;
let metadata;
let testValue;

describe( 'When the metadata exists', () => {

	beforeEach( () => {

		testValue = 'my value';

		metadata = {
			'test-key': {
				'1': testValue
			}
		};

		metadataName = proxyquire( modulePath, {
			'../metadata': metadata
		} );
	} );

	it( 'Should return the item', () => {

		expect( metadataName( '1', 'test-key' ) ).toEqual( testValue );
	} );
} );
