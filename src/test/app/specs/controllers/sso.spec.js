const proxyquire = require( 'proxyquire' );
const modulePath = '../../../../app/controllers/sso';
const mockLogger = require( '../../helpers/mock-logger' );

function stringify( params ){

	const arr = [];

	for( let paramKey in params ){

		arr.push( `${ paramKey }=${ encodeURIComponent( params[ paramKey ] ) }` );
	}

	return arr.join( '&' );
}

describe( 'SSO controller', () => {

	const uuid = 'abc-123-def';
	const ssoClientId = 'client-id';
	const ssoSecret = 'sso-secret';
	const ssoProtocol = 'http';
	const ssoPort = 2000;
	const ssoDomain = 'local-test';
	const ssoRedirectUri = 'http://localhost/login/callback/';
	const ssoAuthPath = '/o/authorize/';
	const ssoTokenPath = '/o/token/';

	let controller;
	let req;
	let res;
	let params;
	let ssoUri;
	let ssoConfig;
	let request;
	let loginUrl;

	function createController(){
		controller = proxyquire( modulePath, {
			request,
			'uuid/v4': jasmine.createSpy( 'uuid' ).and.callFake( () => uuid ),
			'../lib/logger': mockLogger.create(),
			'../lib/urls': {
				login: () => loginUrl
			},
			'../config': {
				sso: ssoConfig
			}
		} );
	}

	beforeEach( () => {

		request = jasmine.createSpy( 'request' );

		req = { session: {} };

		res = {
			redirect: jasmine.createSpy( 'res.redirect' )
		};

		loginUrl = '/my-login/';

		ssoConfig = {
			client: ssoClientId,
			secret: ssoSecret,
			redirectUri: ssoRedirectUri,
			protocol: ssoProtocol,
			domain: ssoDomain,
			port: ssoPort,
			paramLength: 20,
			path: {
				auth: ssoAuthPath,
				token: ssoTokenPath
			}
		};
	} );

	afterEach( () => {
	
		controller = null;
	} );
	
	describe( 'authRedirect', () => {

		beforeEach( () => {

			req.session.save = jasmine.createSpy( 'session.save' ).and.callFake( ( cb ) => cb() );

			ssoUri = `${ ssoProtocol }://${ ssoDomain }:${ ssoPort }${ ssoAuthPath }`;

			params = {
				response_type: 'code',
				client_id: ssoClientId,
				redirect_uri: ssoRedirectUri,
				state: uuid
			};
		} );

		describe( 'Without a mock code', () => {

			describe( 'When the session is saved successfully', () => {
			
				it( 'Should create a stateId, save it and redirect to SSO', () => {
			
					createController();
					controller.authRedirect( req, res );

					expect( req.session.oauthStateId ).toEqual( uuid );
					expect( req.session.save ).toHaveBeenCalled();
					expect( res.redirect ).toHaveBeenCalledWith( `${ ssoUri }?${ stringify( params ) }` );
				} );
			} );
		
			describe( 'When there is an error saving the session', () => {
			
				it( 'Should throw the error', () => {
			
					const testError = new Error( 'test session save error' );
					req.session.save = jasmine.createSpy( 'session.save' ).and.callFake( ( cb ) => cb( testError ) );
					createController();

					expect( () => {

						controller.authRedirect( req, res );

					} ).toThrow( testError );

					expect( req.session.oauthStateId ).toEqual( uuid );
				} );
			} );
		} );

		describe( 'With a mock code', () => {
		
			it( 'Should create a stateId, save it and redirect to SSO with the mock code', () => {

				const code = 'mock-sso-code';

				ssoConfig.mockCode = code;
				params.code = code;

				createController();
		
				controller.authRedirect( req, res );

				expect( req.session.oauthStateId ).toEqual( uuid );
				expect( req.session.save ).toHaveBeenCalled();
				expect( res.redirect ).toHaveBeenCalledWith( `${ ssoUri }?${ stringify( params ) }` );
			} );
		} );
	} );

	describe( 'callback', () => {

		beforeEach( () => {
		
			ssoUri = `${ ssoProtocol }://${ ssoDomain }:${ ssoPort }${ ssoTokenPath }`;
		} );

		describe( 'Without validation errors', () => {

			let code;

			beforeEach( () => {
				
				code = 'my-code';

				req.session.oauthStateId = uuid;

				req.query = {
					state: uuid,
					code
				};
			} );

			it( 'Should call the API with the correct options and a function', () => {
			
				createController();
				controller.callback( req, res );

				expect( request.calls.argsFor( 0 )[ 0 ] ).toEqual( {
					method: 'POST',
					url: ssoUri,
					formData: {
						code,
						grant_type: 'authorization_code',
						client_id: ssoClientId,
						client_secret: ssoSecret,
						redirect_uri: ssoRedirectUri,
					},
					json: true,
				} );

				expect( typeof request.calls.argsFor( 0 )[ 1 ] ).toEqual( 'function' );
			} );
		
			describe( 'With a successful response from the token API', () => {
			
				describe( 'With an access_token', () => {

					let accessToken;

					beforeEach( () => {
					
						accessToken = 'some-access-token';
						request.and.callFake( ( opts, cb ) => cb( null, {}, { access_token: accessToken } ) );
					} );

					describe( 'When a return path is in the session', () => {
					
						it( 'Should store the token and redirect to the return path', () => {
					
							const returnPath = '/a/path/';

							req.session.returnPath = returnPath;

							createController();
							controller.callback( req, res );

							expect( req.session.ssoToken ).toEqual( accessToken );
							expect( req.session.oauthStateId ).not.toBeDefined();
							expect( res.redirect ).toHaveBeenCalledWith( returnPath );
						} );
					} );
				
					describe( 'When a return path is NOT in the session', () => {
					
						it( 'Should store the token and redirect to the root', () => {
					
							createController();
							controller.callback( req, res );

							expect( req.session.ssoToken ).toEqual( accessToken );
							expect( req.session.oauthStateId ).not.toBeDefined();
							expect( res.redirect ).toHaveBeenCalledWith( '/' );
						} );
					} );
				} );

				describe( 'Without an access_token', () => {
				
					it( 'Should throw an error', () => {
					
						request.and.callFake( ( opts, cb ) => cb( null, {}, {} ) );

						createController();

						expect( () => {

							controller.callback( req, res );

						} ).toThrow( new Error( 'No access_token from SSO' ) );
					} );
				} );
			} );

			describe( 'With an error response from the token API', () => {
			
				it( 'Should throw an error', () => {

					request.and.callFake( ( opts, cb ) => cb( new Error( 'Test fail response' ) ) );
				
					createController();
					expect( () => {

						controller.callback( req, res );

					} ).toThrow( new Error( 'Error with token request' ) );
				} );
			} );
		} );

		describe( 'Missing state in the session', () => {
		
			it( 'Should redirect to the login page', () => {

				req.query = {};
		
				createController();
				controller.callback( req, res );

				expect( res.redirect ).toHaveBeenCalledWith( loginUrl );
			} );
		} );

		describe( 'With validation errors', () => {

			beforeEach( () => {
			
				req.session.oauthStateId = uuid;
			} );
		
			describe( 'With an error param', () => {
			
				it( 'Should throw an error', () => {

					const errorParam = 'my-error';

					req.query = {
						error: errorParam,
						state: uuid,
						code: '1234'
					};

					createController();

					expect( () => {

						controller.callback( req, res );

					} ).toThrow( new Error( `Error with SSO: ${ errorParam }` ) );

				} );
			} );

			describe( 'When the state does not match', () => {
			
				it( 'Should throw an error', () => {

					const stateParam = 'my-state';

					req.query = {
						state: stateParam,
						code: '1234'
					};

					createController();

					expect( () => {

						controller.callback( req, res );

					} ).toThrow( new Error( `StateId mismatch: '${ stateParam }' !== '${ uuid }'` ) );
					
				} );
			} );

			describe( 'When the code param is too long', () => {
			
				it( 'Should throw an error', () => {

					const codeParam = '123456789';

					req.query = {
						state: uuid,
						code: codeParam
					};

					ssoConfig.paramLength = 5;

					createController();

					expect( () => {

						controller.callback( req, res );

					} ).toThrow( new Error( `Code param too long: ${ codeParam.length }` ) );
					
				} );
			} );

			describe( 'When the code param is not alphanumeric', () => {
			
				it( 'Should throw an error', () => {

					req.query = {
						state: uuid,
						code: '1234-_;'
					};

					createController();

					expect( () => {

						controller.callback( req, res );

					} ).toThrow( new Error( 'Invalid code param' ) );
					
				} );
			} );
		} );
	} );
} );

