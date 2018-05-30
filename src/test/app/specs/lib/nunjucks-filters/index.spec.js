const proxyquire = require( 'proxyquire' );

describe( 'Nunjucks filters', function(){

	let nunjucksFilters;
	let highlight;
	let removeEmpty;
	let dateOnly;

	beforeEach( function(){

		highlight = jasmine.createSpy( 'highlight' );
		removeEmpty = jasmine.createSpy( 'removeEmpty' );
		dateOnly = jasmine.createSpy( 'dateOnly' );

		nunjucksFilters = proxyquire( '../../../../../app/lib/nunjucks-filters', {
			'./highlight': highlight,
			'./remove-empty': removeEmpty,
			'./date-only': dateOnly
		} );
	} );

	it( 'Should add all the filters', function(){

		const addFilter = jasmine.createSpy( 'addFilter' );

		nunjucksFilters( { addFilter } );

		let args = addFilter.calls.argsFor( 0 );

		expect( args[ 0 ] ).toEqual( 'highlight' );
		expect( args[ 1 ] ).toEqual( highlight );

		args = addFilter.calls.argsFor( 1 );

		expect( args[ 0 ] ).toEqual( 'removeEmpty' );
		expect( args[ 1 ] ).toEqual( removeEmpty );

		args = addFilter.calls.argsFor( 2 );

		expect( args[ 0 ] ).toEqual( 'dateOnly' );
		expect( args[ 1 ] ).toEqual( dateOnly );
	} );
} );
