const proxyquire = require( 'proxyquire' );
const modulePath = './index';

describe( 'Nunjucks filters', function(){

	let nunjucksFilters;
	let spies;
	let stubs;

	const filters = [
		[ './highlight', 'highlight' ],
		[ './remove-empty', 'removeEmpty' ],
		[ './date-only', 'dateOnly' ],
		[ './date-with-time', 'dateWithTime' ],
		[ './error-for-name', 'errorForName' ],
		[ './metadata-name', 'metadataName' ],
		[ './add-to-radio', 'addToRadio' ],
		[ './time', 'time' ],
		[ './linkify', 'linkify' ],
	];

	beforeEach( function(){

		spies = {};
		stubs = {};

		filters.forEach( ( [ path, filterName ] ) => {

			spies[ filterName ] = jasmine.createSpy( filterName );
			stubs[ path ] = spies[ filterName ];
		} );


		nunjucksFilters = proxyquire( modulePath, stubs );
	} );

	it( 'Should add all the filters', function(){

		const addFilter = jasmine.createSpy( 'addFilter' );

		nunjucksFilters( { addFilter } );

		filters.forEach( ( [ , filterName ], index ) => {

			const args = addFilter.calls.argsFor( index );

			expect( args[ 0 ] ).toEqual( filterName );
			expect( args[ 1 ] ).toEqual( spies[ filterName ] );
		} );
	} );
} );
