const sorters = require( './sort-govuk-items' );

describe( 'Sort govuk items', () => {
	it( 'Should sort the items in alphabetical order', () => {

		const items = [
			{ value: '', text: 'a' },
			{ value: '', text: 'c' },
			{ value: '', text: 'b' },
		];

		items.sort( sorters.alphabetical );

		expect( items ).toEqual( [
			{ value: '', text: 'a' },
			{ value: '', text: 'b' },
			{ value: '', text: 'c' },
		] );
	} );
} );
