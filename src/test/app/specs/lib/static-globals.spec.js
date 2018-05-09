const proxyquire = require( 'proxyquire' );

describe( 'Static globals', function(){

	const analyticsId = 'abc123';
	const datahubDomain = 'https://some-domain.com';

	let calls;
	let staticGlobals;

	beforeEach( function(){

		const stubs = {
			'../config': {
				analyticsId,
				datahubDomain
			}
		};

		staticGlobals = proxyquire( '../../../../app/lib/static-globals', stubs );

		const env = {
			addGlobal: jasmine.createSpy( 'env.addGlobal' )
		};

		staticGlobals( env );
		calls = env.addGlobal.calls;
	} );

	it( 'Should add the analyticsId to the nunjucks env', function(){

		const args = calls.argsFor( 0 );

		expect( args[ 0 ] ).toEqual( 'analyticsId' );
		expect( args[ 1 ] ).toEqual( analyticsId );
	} );

	it( 'Should add the default service to the nunjucks env', function(){

		const args = calls.argsFor( 1 );

		expect( args[ 0 ] ).toEqual( 'feedbackLink' );
		expect( args[ 1 ] ).toEqual( `${ datahubDomain }/support` );
	} );

	it( 'Should add the headerLink to the nunjucks env', function(){

		const args = calls.argsFor( 2 );

		expect( args[ 0 ] ).toEqual( 'headerLink' );
		expect( args[ 1 ] ).toEqual( `${ datahubDomain }/` );
	} );

	it( 'Should add the profileLink to the nunjucks env', function(){

		const args = calls.argsFor( 3 );

		expect( args[ 0 ] ).toEqual( 'profileLink' );
		expect( args[ 1 ] ).toEqual( `${ datahubDomain }/profile` );
	} );
} );
