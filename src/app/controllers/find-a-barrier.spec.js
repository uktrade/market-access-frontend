const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const faker = require( 'faker' );
const modulePath = './find-a-barrier';

describe( 'Find a barrier controller', () => {

	let controller;
	let req;
	let res;
	let next;
	let backend;
	let validators;
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
				getAll: jasmine.createSpy( 'backend.barriers.getAll' )
			}
		};
		viewModel = jasmine.createSpy( 'view-model' );
		validators = {
			isCountry: jasmine.createSpy( 'validators.isCountry' ),
			isSector: jasmine.createSpy( 'validators.isSector' ),
			isBarrierType: jasmine.createSpy( 'validators.isBarrierType' ),
		};

		controller = proxyquire( modulePath, {
			'../lib/backend-service': backend,
			'../view-models/find-a-barrier': viewModel,
			'../lib/validators': validators
		} );
	} );

	describe( 'When the backend call is a success', () => {
		describe( 'With no filters', () => {
			it( 'Should render the template without filters', async () => {

				const viewModelResponse = { a: 1, b: 2 };
				const data = jasmine.helpers.getFakeData( '/backend/barriers/' );

				viewModel.and.callFake( () => viewModelResponse );

				backend.barriers.getAll.and.callFake( () => ({
					response: { isSuccess: true },
					body: data
				}) );

				await controller( req, res, next );

				expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, {} );
				expect( res.render ).toHaveBeenCalledWith( template, viewModelResponse );
				expect( next ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'With a country filter', () => {

			let country;
			let viewModelResponse;

			beforeEach( () => {

				country = uuid();
				req.query.country = country;
				viewModelResponse = { a: 1, b: 2 };

				viewModel.and.callFake( () => viewModelResponse );

				backend.barriers.getAll.and.callFake( () => ({
					response: { isSuccess: true },
					body: jasmine.helpers.getFakeData( '/backend/barriers/' )
				}) );
			} );

			afterEach( () => {

				expect( res.render ).toHaveBeenCalledWith( template, viewModelResponse );
				expect( next ).not.toHaveBeenCalled();
			} );

			describe( 'When the country is valid', () => {
				it( 'Should render the template with a filter', async () => {

					validators.isCountry.and.callFake( () => true );

					await controller( req, res, next );

					expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, { country } );
				} );
			} );

			describe( 'When the country is NOT valid', () => {
				it( 'Should render the template without filters', async () => {

					validators.isCountry.and.callFake( () => false );

					await controller( req, res, next );

					expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, {} );
				} );
			} );
		} );

		describe( 'With a sector filter', () => {

			let sector;
			let viewModelResponse;

			beforeEach( () => {

				sector = uuid();
				req.query.sector = sector;
				viewModelResponse = { a: 1, b: 2 };

				viewModel.and.callFake( () => viewModelResponse );

				backend.barriers.getAll.and.callFake( () => ({
					response: { isSuccess: true },
					body: jasmine.helpers.getFakeData( '/backend/barriers/' )
				}) );
			} );

			afterEach( () => {

				expect( res.render ).toHaveBeenCalledWith( template, viewModelResponse );
				expect( next ).not.toHaveBeenCalled();
			} );

			describe( 'When the sector is valid', () => {
				it( 'Should render the template with a filter', async () => {

					validators.isSector.and.callFake( () => true );

					await controller( req, res, next );

					expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, { sector } );
				} );
			} );

			describe( 'When the sector is NOT valid', () => {
				it( 'Should render the template without filters', async () => {

					validators.isSector.and.callFake( () => false );

					await controller( req, res, next );

					expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, {} );
				} );
			} );
		} );

		describe( 'With a type filter', () => {

			let type;
			let viewModelResponse;

			beforeEach( () => {

				type = faker.lorem.word().toUpperCase();
				req.query.type = type;
				viewModelResponse = { a: 1, b: 2 };

				viewModel.and.callFake( () => viewModelResponse );

				backend.barriers.getAll.and.callFake( () => ({
					response: { isSuccess: true },
					body: jasmine.helpers.getFakeData( '/backend/barriers/' )
				}) );
			} );

			afterEach( () => {

				expect( res.render ).toHaveBeenCalledWith( template, viewModelResponse );
				expect( next ).not.toHaveBeenCalled();
			} );

			describe( 'When the type is valid', () => {
				it( 'Should render the template with a filter', async () => {

					validators.isBarrierType.and.callFake( () => true );

					await controller( req, res, next );

					expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, { type } );
				} );
			} );

			describe( 'When the type is NOT valid', () => {
				it( 'Should render the template without filters', async () => {

					validators.isBarrierType.and.callFake( () => false );

					await controller( req, res, next );

					expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, {} );
				} );
			} );
		} );
	} );

	describe( 'When the backend call is not a success', () => {
		describe( 'When it is a 500', () => {
			it( 'Should call next with an error', async () => {

				const statusCode = 500;

				backend.barriers.getAll.and.callFake( () => Promise.resolve( {
					response: { isSuccess: false, statusCode }
				} ) );

				await controller( req, res, next );

				expect( next ).toHaveBeenCalledWith( new Error( `Got ${ statusCode } response from backend` ) );
				expect( res.render ).not.toHaveBeenCalled();
			} );
		} );
	} );

	describe( 'When the backend call throws an error', () => {
		it( 'Shoud call next with the error', async () => {

			const err = new Error( 'a major error' );
			backend.barriers.getAll.and.callFake( () => { throw err; } );

			await controller( req, res, next );

			expect( next ).toHaveBeenCalledWith( err );
			expect( res.render ).not.toHaveBeenCalled();
		} );
	} );
} );
