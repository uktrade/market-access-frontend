const proxyquire = require( 'proxyquire' );
const modulePath = './static-globals';

describe( 'Static globals', function(){

	const analytics = { id: 'abc123', enabled: true };
	const datahubDomain = 'https://some-domain.com';

	let calls;
	let staticGlobals;
	let urls;
	let isDev;
	let feedbackEmail;

	beforeEach( function(){

		urls = { mySpy: true };
		isDev = false;
		feedbackEmail = 'test@test.com';

		staticGlobals = proxyquire( modulePath, {
			'../config': {
				analytics,
				datahubDomain,
				isDev,
				feedbackEmail
			},
			'./urls': urls
		} );

		const env = {
			addGlobal: jasmine.createSpy( 'env.addGlobal' )
		};

		staticGlobals( env );
		calls = env.addGlobal.calls;
	} );

	it( 'Should add the analytics to the nunjucks env', function(){

		const args = calls.argsFor( 0 );

		expect( args[ 0 ] ).toEqual( 'analytics' );
		expect( args[ 1 ] ).toEqual( analytics );
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

	it( 'Should add the urls', () => {

		const args = calls.argsFor( 4 );

		expect( args[ 0 ] ).toEqual( 'urls' );
		expect( args[ 1 ] ).toEqual( urls );
	} );

	it( 'Should set showErrors', () => {

		const args = calls.argsFor( 5 );

		expect( args[ 0 ] ).toEqual( 'showErrors' );
		expect( args[ 1 ] ).toEqual( isDev );
	} );

	it( 'Should set feedbackEmail', () => {

		const args = calls.argsFor( 6 );

		expect( args[ 0 ] ).toEqual( 'feedbackEmail' );
		expect( args[ 1 ] ).toEqual( feedbackEmail );
	} );
} );
