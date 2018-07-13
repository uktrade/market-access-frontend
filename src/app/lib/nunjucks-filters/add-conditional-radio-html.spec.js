const addConditionalRadioHtml = require( './add-conditional-radio-html' );

describe( 'addConditionalRadioHtml', () => {
	describe( 'When the data item matches', () => {
		it( 'Should add an id and conditional property', () => {

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

			const data = {
				'1': { html: radio1Html },
				'2': { id: 'my-item-2', html: radio2Html },
				'3': { html: radio3Html }
			};

			const output = addConditionalRadioHtml( input, data );

			expect( output[ 0 ] ).toEqual( {
				id: input[ 0 ].id,
				value: input[ 0 ].value,
				conditional: { html: radio1Html }
			} );

			expect( output[ 1 ] ).toEqual( {
				id: data[ '2' ].id,
				value: input[ 1 ].value,
				conditional: { html: radio2Html }
			} );

			expect( output[ 2 ] ).toEqual( {
				id: input[ 2 ].value,
				value: input[ 2 ].value,
				conditional: { html: radio3Html }
			} );
		} );
	} );
} );
