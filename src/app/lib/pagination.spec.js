const { create } = require( './pagination' );

describe( 'pagination', () => {
	describe( '#create', () => {

		const query = { term: 'samsung' };

		it( 'returns null if count is not given', () => {

			const actual = create( query, 10 );
			expect( actual ).toEqual( null );
		});

		it( 'returns a minimal pagination object if totalPages is less than 2', () => {

			const actual = create( query, 10, 10 );
			expect( actual ).toEqual( {
				totalPages: 1,
				currentPage: 1,
			} );
		});

		it( 'returns the pagination object when all required params are given', () => {

			const actual = create( query, 5, 10, 1 );
			const expected = {
				totalPages: 2,
				currentPage: 1,
				prev: null,
				next: '?term=samsung&page=2',
				pages: [
					{ label: 1, url: '?term=samsung&page=1' },
					{ label: 2, url: '?term=samsung&page=2' },
				],
			};

			expect( actual ).toEqual( expected );
		});

		it( 'returns the pagination object with correct current page', () => {

			const actual = create( query, 5, 10, 2 );
			const expected = {
				totalPages: 2,
				currentPage: 2,
				prev: '?term=samsung&page=1',
				next: null,
				pages: [
					{ label: 1, url: '?term=samsung&page=1' },
					{ label: 2, url: '?term=samsung&page=2' },
				],
			};
			expect( actual ).toEqual( expected );
		});

		it( 'returns the pagination object with truncation', () => {

			const actual = create( query, 2, 10, 1, 2 );
			const expected = {
				totalPages: 5,
				currentPage: 1,
				prev: null,
				next: '?term=samsung&page=2',
				pages: [
					{ label: 1, url: '?term=samsung&page=1' },
					{ label: 2, url: '?term=samsung&page=2' },
					{ label: '…' },
					{ label: 5, url: '?term=samsung&page=5' },
				],
			};
			expect( actual ).toEqual( expected );
		});

		it( 'returns the pagination object without truncation when it’s not needed', () => {

			const actual = create( query, 2, 10, 1, 6 );
			const expected = {
				totalPages: 5,
				currentPage: 1,
				prev: null,
				next: '?term=samsung&page=2',
				pages: [
					{ label: 1, url: '?term=samsung&page=1' },
					{ label: 2, url: '?term=samsung&page=2' },
					{ label: 3, url: '?term=samsung&page=3' },
					{ label: 4, url: '?term=samsung&page=4' },
					{ label: 5, url: '?term=samsung&page=5' },
				],
			};
			expect( actual ).toEqual( expected );
		});

		it( 'returns the pagination object with truncation in the right place when current page is changed', () => {

			const actual = create( query, 2, 10, 4, 2 );
			const expected = {
				totalPages: 5,
				currentPage: 4,
				prev: '?term=samsung&page=3',
				next: '?term=samsung&page=5',
				pages: [
					{ label: 1, url: '?term=samsung&page=1' },
					{ label: '…' },
					{ label: 4, url: '?term=samsung&page=4' },
					{ label: 5, url: '?term=samsung&page=5' },
				],
			};
			expect( actual ).toEqual( expected );
		});

		it( 'returns the pagination object with truncation in the right place when current page is changed', () => {

			const actual = create( query, 2, 20, 3, 2 );
			const expected = {
				totalPages: 10,
				currentPage: 3,
				prev: '?term=samsung&page=2',
				next: '?term=samsung&page=4',
				pages: [
					{ label: 1, url: '?term=samsung&page=1' },
					{ label: 2, url: '?term=samsung&page=2' },
					{ label: 3, url: '?term=samsung&page=3' },
					{ label: 4, url: '?term=samsung&page=4' },
					{ label: '…' },
					{ label: 10, url: '?term=samsung&page=10' },
				],
			};

			expect( actual ).toEqual( expected );
		});

		it('returns the pagination object with no truncation when block start page is close to first or last pages', () => {

			const actual = create( query, 3, 21, 4 );
			const expected = {
				totalPages: 7,
				currentPage: 4,
				prev: '?term=samsung&page=3',
				next: '?term=samsung&page=5',
				pages: [
					{ label: 1, url: '?term=samsung&page=1' },
					{ label: 2, url: '?term=samsung&page=2' },
					{ label: 3, url: '?term=samsung&page=3' },
					{ label: 4, url: '?term=samsung&page=4' },
					{ label: 5, url: '?term=samsung&page=5' },
					{ label: 6, url: '?term=samsung&page=6' },
					{ label: 7, url: '?term=samsung&page=7' },
				],
			};
			expect( actual ).toEqual( expected );
		});
	});
});
