const proxyquire = require( 'proxyquire' );
const EventEmitter = require( 'events' );
const modulePath = './find-a-barrier';

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

		req = {
			query: {}
		};
		res = {
			render: jasmine.createSpy( 'res.render' )
		};
		next = jasmine.createSpy( 'next' );
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
		describe( 'When the backend call is a success', () => {
			it( 'Gets the filters from the querystring and renders the template', async () => {

				const viewModelResponse = { a: 1, b: 2 };
				const data = jasmine.helpers.getFakeData( '/backend/barriers/' );

				viewModel.and.callFake( () => viewModelResponse );

				backend.barriers.getAll.and.callFake( () => ({
					response: { isSuccess: true },
					body: data
				}) );

				req.query = { filter1: 'true', filter2: 'true' };

				await controller.list( req, res, next );

				expect( getFromQueryString ).toHaveBeenCalledWith( req.query );
				expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, getFromQueryStringResponse );
				expect( res.render ).toHaveBeenCalledWith( template, viewModelResponse );
				expect( next ).not.toHaveBeenCalled();
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

					expect( next ).toHaveBeenCalledWith( new Error( `Got ${ statusCode } response from backend` ) );
					expect( res.render ).not.toHaveBeenCalled();
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
