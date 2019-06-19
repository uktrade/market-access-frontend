const proxyquire = require( 'proxyquire' );
const modulePath = './linkify';

let linkify;
let autolinker;
let mockResponse;

describe( 'linkify nunjucks filter', () => {

	beforeEach( () => {

		mockResponse = 'my value';

		function Autolinker(){
			autolinker = this;
		}
		Autolinker.prototype.link = jasmine.createSpy( 'Autolinker.link' ).and.callFake( () => mockResponse );

		linkify = proxyquire( modulePath, {
			'autolinker': Autolinker
		} );
	} );

	it( 'Should return value from Autoliker.link', () => {

		const testString = 'test string';

		expect( linkify( testString ) ).toEqual( mockResponse );
		expect( autolinker.link ).toHaveBeenCalledWith( testString );
	} );
} );
