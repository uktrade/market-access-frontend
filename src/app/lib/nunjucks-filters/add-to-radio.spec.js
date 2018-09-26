const addToRadio = require( './add-to-radio' );

describe( 'addToRadio', () => {
	describe( 'When the data item matches', () => {
		it( 'Should add an id and any other properties', () => {

			const radio1Html = '<foo>';
			const radio2Html = '<bar>';
			const radio3Html = '<baz>';
			const input = [
				{
					id: 'my-item',
					value: '1',
				},{
					value: '2'
				},{
					value: '3'
				}
			];

			const hint = { text: 'my hint text' };

			const data = {
				'1': { conditional: { html: radio1Html } },
				'2': { id: 'my-item-2', conditional: { html: radio2Html } },
				'3': { conditional: { html: radio3Html }, hint }
			};

			const output = addToRadio( input, data );

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
		} );
	} );
} );
