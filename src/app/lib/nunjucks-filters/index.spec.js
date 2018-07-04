const proxyquire = require( 'proxyquire' );
const modulePath = './index';

describe( 'Nunjucks filters', function(){

	let nunjucksFilters;

	beforeEach( function(){

		this.highlight = jasmine.createSpy( 'highlight' );
		this.removeEmpty = jasmine.createSpy( 'removeEmpty' );
		this.dateOnly = jasmine.createSpy( 'dateOnly' );
		this.dateWithTime = jasmine.createSpy( 'dataWithTime' );

		nunjucksFilters = proxyquire( modulePath, {
			'./highlight': this.highlight,
			'./remove-empty': this.removeEmpty,
			'./date-only': this.dateOnly,
			'./date-with-time': this.dateWithTime
		} );
	} );

	it( 'Should add all the filters', function(){

		const addFilter = jasmine.createSpy( 'addFilter' );

		nunjucksFilters( { addFilter } );

		let args = addFilter.calls.argsFor( 0 );

		expect( args[ 0 ] ).toEqual( 'highlight' );
		expect( args[ 1 ] ).toEqual( this.highlight );

		args = addFilter.calls.argsFor( 1 );

		expect( args[ 0 ] ).toEqual( 'removeEmpty' );
		expect( args[ 1 ] ).toEqual( this.removeEmpty );

		args = addFilter.calls.argsFor( 2 );

		expect( args[ 0 ] ).toEqual( 'dateOnly' );
		expect( args[ 1 ] ).toEqual( this.dateOnly );

		args = addFilter.calls.argsFor( 3 );

		expect( args[ 0 ] ).toEqual( 'dateWithTime' );
		expect( args[ 1 ] ).toEqual( this.dateWithTime );
	} );
} );
