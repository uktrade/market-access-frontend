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
	let maxFileSize;
	let fileSize;
	let fileSizeResponse;
	let environment;

	beforeEach( function(){

		urls = { mySpy: true };
		isDev = false;
		feedbackEmail = 'test@test.com';
		maxFileSize = ( 5 * 1024 * 2014 );
		fileSizeResponse = '123 MB';
		fileSize = jasmine.createSpy( 'fileSize' );
		environment = {
			name: 'test',
			banner: false,
		};

		staticGlobals = proxyquire( modulePath, {
			'../config': {
				analytics,
				datahubDomain,
				isDev,
				feedbackEmail,
				files: {
					maxSize: maxFileSize
				},
				environment,
			},
			'./urls': urls,
			'./file-size': fileSize,
		} );

		const env = {
			addGlobal: jasmine.createSpy( 'env.addGlobal' )
		};

		fileSize.and.callFake( () => fileSizeResponse );

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

	it( 'Should set maxFileSize', () => {

		const args = calls.argsFor( 7 );

		expect( args[ 0 ] ).toEqual( 'maxFileSize' );
		expect( args[ 1 ] ).toEqual( fileSizeResponse );

		expect( fileSize ).toHaveBeenCalledWith( maxFileSize );
	} );

	it( 'Should set the environment', () => {

		const args = calls.argsFor( 8 );

		expect( args[ 0 ] ).toEqual( 'env' );
		expect( args[ 1 ] ).toEqual( environment );
	} );

	it( 'Should set the assetPath', () => {

		const args = calls.argsFor( 9 );

		expect( args[ 0 ] ).toEqual( 'assetPath' );
		expect( args[ 1 ] ).toEqual( '/govuk-public' );
	} );
} );
