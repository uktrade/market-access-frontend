const addToRadio = require( './add-to-radio' );

describe( 'addToRadio', () => {
	describe( 'When the data item matches', () => {

		let radio1Html;
		let radio2Html;
		let radio3Html;
		let radio4Html;
		let input;
		let hint;
		let output;

		beforeEach( () => {

			radio1Html = '<foo>';
			radio2Html = '<bar>';
			radio3Html = '<baz>';
			radio4Html = '<boop>';

			input = [
				{
					id: 'my-item',
					value: '1',
				},{
					value: '2'
				},{
					value: '3'
				},{
					value: 0,
				}
			];

			hint = { text: 'my hint text' };
		} );

		afterEach( () => {

			expect( output[ 0 ] ).toEqual( {
				id: 'my-item',
				value: input[ 0 ].value,
				conditional: { html: radio1Html }
			} );

			expect( output[ 1 ] ).toEqual( {
				id: 'my-item-2',
				value: input[ 1 ].value,
				conditional: { html: radio2Html }
			} );

			expect( output[ 2 ] ).toEqual( {
				id: '3',
				value: input[ 2 ].value,
				conditional: { html: radio3Html },
				hint
			} );

			expect( output[ 3 ] ).toEqual( {
				id: 0,
				value: input[ 3 ].value,
				conditional: { html: radio4Html }
			} );
		} );

		describe( 'when the data is an object', () => {
			it( 'Should add an id and any other properties', () => {

				const data = {
					'1': { conditional: { html: radio1Html } },
					'2': { id: 'my-item-2', conditional: { html: radio2Html } },
					'3': { conditional: { html: radio3Html }, hint },
					0: { conditional: { html: radio4Html } },
				};

				output = addToRadio( input, data );
			} );
		} );

		describe( 'when the data is many arguments', () => {
			it( 'Should add an id and any other properties', () => {

				output = addToRadio(
					input,
					[ '1', { conditional: { html: radio1Html } } ],
					[ '2', { id: 'my-item-2', conditional: { html: radio2Html } } ],
					[ '3', { conditional: { html: radio3Html }, hint } ],
					[ 0, { conditional: { html: radio4Html } } ],
				);
			} );
		} );
	} );
} );
