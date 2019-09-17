const proxyquire = require( 'proxyquire' );
const EventEmitter = require( 'events' );
const HttpResponseError = require( '../lib/HttpResponseError' );
const modulePath = './find-a-barrier';


const { mocks } = jasmine.helpers;

describe( 'Find a barrier controller', () => {

	let controller;
	let req;
	let res;
	let next;
	let backend;
	let getFromQueryString;
	let getFromQueryStringResponse;
	let viewModel;

	const template = 'find-a-barrier';

	beforeEach( () => {

		( { req, res, next } = mocks.middleware() );

		backend = {
			barriers: {
				getAll: jasmine.createSpy( 'backend.barriers.getAll' ),
				download: jasmine.createSpy( 'backend.barriers.download' ),
			}
		};
		viewModel = jasmine.createSpy( 'view-model' );

		getFromQueryStringResponse = { queryResponse: 'response text' };
		getFromQueryString = jasmine.createSpy( 'barrierFilters.getFromQueryString' ).and.callFake( () => getFromQueryStringResponse );

		controller = proxyquire( modulePath, {
			'../lib/backend-service': backend,
			'../view-models/find-a-barrier': viewModel,
			'../lib/barrier-filters': { getFromQueryString }
		} );
	} );

	describe( 'list', () => {

		function checkBackendCall( page = 1 ){

			expect( getFromQueryString ).toHaveBeenCalledWith( req.query );
			expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, getFromQueryStringResponse, page );
		}

		describe( 'When the backend call is a success', () => {

			let viewModelResponse;
			let data;

			function checkViewModel( viewModelArgs, filtersMatchEditList = false ){

				expect( viewModelArgs.count ).toEqual( data.count );
				expect( viewModelArgs.page ).toEqual( parseInt( req.query.page, 10 ) || 1 );
				expect( viewModelArgs.barriers ).toEqual( data.results );
				expect( viewModelArgs.filters ).toEqual( getFromQueryStringResponse );
				expect( viewModelArgs.filtersMatchEditList ).toEqual( filtersMatchEditList );
			}

			beforeEach( () => {

				data = jasmine.helpers.getFakeData( '/backend/barriers/' );

				viewModelResponse = { a: 1, b: 2 };
				viewModel.and.returnValue( viewModelResponse );

				backend.barriers.getAll.and.callFake( () => ({
					response: { isSuccess: true },
					body: data
				}) );
			} );

			afterEach( () => {

				expect( res.render ).toHaveBeenCalledWith( template, viewModelResponse );
				expect( next ).not.toHaveBeenCalled();
			} );

			describe( 'Without a watchlist edit param', () => {
				describe( 'With no page param', () => {
					it( 'Gets the filters from the querystring and renders the template', async () => {

						req.query = { filter1: 'true', filter2: 'true' };

						await controller.list( req, res, next );

						const viewModelArgs = viewModel.calls.argsFor( 0 )[ 0 ];

						expect( viewModelArgs.isEdit ).toEqual( false );
						expect( viewModelArgs.editListIndex ).toBeUndefined();
						checkBackendCall();
						checkViewModel( viewModelArgs );
					} );
				} );

				describe( 'With a page param set', () => {

					beforeEach( () => {

						req.query = { filter1: 'true', filter2: 'true' };
					} );

					afterEach( () => {

						const viewModelArgs = viewModel.calls.argsFor( 0 )[ 0 ];

						expect( viewModelArgs.isEdit ).toEqual( false );
						expect( viewModelArgs.editListIndex ).toBeUndefined();
						checkViewModel( viewModelArgs );
					} );

					describe( 'When the param is a valid number as a string', () => {
						it( 'adds the correct page', async () => {

							req.query.page = '2';

							await controller.list( req, res, next );
							checkBackendCall( 2 );
						} );
					} );

					describe( 'When the param is a valid number as a string', () => {
						it( 'adds the correct page', async () => {

							req.query.page = '3';

							await controller.list( req, res, next );
							checkBackendCall( 3 );
						} );
					} );

					describe( 'When the param has a valid number at the start of the string', () => {
						it( 'adds the correct page', async () => {

							req.query.page = '2x3yz';

							await controller.list( req, res, next );
							checkBackendCall( 2 );
						} );
					} );

					describe( 'When the param is an invalid string', () => {
						it( 'adds the correct page', async () => {

							req.query.page = 'xyz';

							await controller.list( req, res, next );
							checkBackendCall();
						} );
					} );

					describe( 'When the param is an invalid string', () => {
						it( 'adds the correct page', async () => {

							req.query.page = 'x2yz';

							await controller.list( req, res, next );
							checkBackendCall();
						} );
					} );
				} );
			} );

			describe( 'With a watchlist and edit param', () => {
				it( 'Gets the filters from the querystring and renders the template', async () => {

					req.watchList.lists = [ { name: 'list one', filters: { a: 1, b: 2 } } ];

					req.query = {
						filter1: 'true',
						filter2: 'true',
						editList: '0',
					};

					await controller.list( req, res, next );

					const viewModelArgs = viewModel.calls.argsFor( 0 )[ 0 ];

					expect( viewModelArgs.isEdit ).toEqual( true );
					expect( viewModelArgs.editListIndex ).toEqual( 0 );
					checkBackendCall();
					checkViewModel( viewModelArgs, true );
				} );
			} );
		} );

		describe( 'When the backend call is not a success', () => {
			describe( 'When it is a 500', () => {
				it( 'Calls next with an error', async () => {

					const statusCode = 500;

					backend.barriers.getAll.and.callFake( () => Promise.resolve( {
						response: { isSuccess: false, statusCode }
					} ) );

					await controller.list( req, res, next );

					expect( next ).toHaveBeenCalled();
					expect( next.calls.argsFor( 0 )[ 0 ] instanceof HttpResponseError ).toEqual( true );
					expect( res.render ).not.toHaveBeenCalled();
					checkBackendCall();
				} );
			} );
		} );

		describe( 'When the backend call throws an error', () => {
			it( 'Shoud call next with the error', async () => {

				const err = new Error( 'a major error' );
				backend.barriers.getAll.and.callFake( () => { throw err; } );

				await controller.list( req, res, next );

				expect( next ).toHaveBeenCalledWith( err );
				expect( res.render ).not.toHaveBeenCalled();
				checkBackendCall();
			} );
		} );
	} );

	describe( 'download', () => {

		let request;

		beforeEach( () => {

			request = new EventEmitter();
			request.pipe = jasmine.createSpy( 'request.pipe' );

			backend.barriers.download.and.callFake( () => request );
		} );

		function checkRequest(){

			const err = next.calls.argsFor( 0 )[ 0 ];

			expect( next ).toHaveBeenCalledWith( new Error( 'Unable to download data' ) );
			expect( err.code ).toEqual( 'DOWNLOAD_FAIL' );
			expect( request.pipe ).not.toHaveBeenCalled();
		}

		describe( 'When the response is a 404', () => {
			it( 'Should call next with an error', () => {

				controller.download( req, res, next );

				request.emit( 'response', { statusCode: 404 } );

				checkRequest();
			} );
		} );

		describe( 'When the response is a 500', () => {
			it( 'Should call next with an error', () => {

				controller.download( req, res, next );

				request.emit( 'response', { statusCode: 500 } );

				checkRequest();
			} );
		} );

		describe( 'When the response is a 200', () => {
			it( 'Should not call next', () => {

				controller.download( req, res, next );

				request.emit( 'response', { statusCode: 200 } );

				expect( next ).not.toHaveBeenCalled();
				expect( request.pipe ).toHaveBeenCalledWith( res );
			} );
		} );
	} );
} );
