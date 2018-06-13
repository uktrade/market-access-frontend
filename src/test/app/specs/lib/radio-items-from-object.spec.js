const radioItemsFromObj = require( '../../../../app/lib/radio-items-from-object' );

describe( 'radioItemsFromObject', () => {
	it( 'Should convert an object into an array', () => {

		const input = {
			'1': 'test1',
			'2': 'test2',
			'3': 'test3'
		};

		const output = radioItemsFromObj( input );

		expect( output ).toEqual( [

		{
			value: '1',
			text: 'test1'
		},{
			value: '2',
			text: 'test2'
		},{
			value: '3',
			text: 'test3'
		},
		] );
	} );
} );
