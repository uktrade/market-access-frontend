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
			isOverseasRegion: jasmine.createSpy( 'validators.isOverseasRegion' ),
			isSector: jasmine.createSpy( 'validators.isSector' ),
			isBarrierType: jasmine.createSpy( 'validators.isBarrierType' ),
			isBarrierPriority: jasmine.createSpy( 'validators.isBarrierPriority' ),
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

					expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, { country: [ country ] } );
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

		describe( 'With an overseas region filter', () => {

			let region;
			let viewModelResponse;

			beforeEach( () => {

				region = uuid();
				req.query.region = region;
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

			describe( 'When the region is valid', () => {
				it( 'Should render the template with a filter', async () => {

					validators.isOverseasRegion.and.callFake( () => true );

					await controller( req, res, next );

					expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, { region: [ region ] } );
				} );
			} );

			describe( 'When the region is NOT valid', () => {
				it( 'Should render the template without filters', async () => {

					validators.isOverseasRegion.and.callFake( () => false );

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

					expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, { sector: [ sector ] } );
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

					expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, { type: [ type ] } );
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

		describe( 'With a priority filter', () => {

			let priority;
			let viewModelResponse;

			beforeEach( () => {

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

			describe( 'A single value', () => {

				beforeEach( () => {

					priority = faker.lorem.word().toUpperCase();
					req.query.priority = priority;
				} );

				describe( 'When the priority is valid', () => {
					it( 'Should render the template with a filter', async () => {

						validators.isBarrierPriority.and.callFake( () => true );

						await controller( req, res, next );

						expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, { priority: [ priority ] } );
					} );
				} );

				describe( 'When the priority is NOT valid', () => {
					it( 'Should render the template without filters', async () => {

						validators.isBarrierPriority.and.callFake( () => false );

						await controller( req, res, next );

						expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, {} );
					} );
				} );
			} );

			describe( 'Multiple values', () => {
				describe( 'As an array', () => {

					beforeEach( () => {
						priority = [ 'ABC', 'DEF' ];
						req.query.priority = priority;
					} );

					describe( 'When all priorities are valid', () => {
						it( 'Should render the template with a filter', async () => {

							validators.isBarrierPriority.and.callFake( () => true );

							await controller( req, res, next );

							expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, { priority } );
						} );
					} );

					describe( 'When all priorities are NOT valid', () => {
						it( 'Should render the template without filters', async () => {

							validators.isBarrierPriority.and.callFake( () => false );

							await controller( req, res, next );

							expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, {} );
						} );
					} );

					describe( 'When one priority is valid and one is not', () => {
						it( 'Should render the template with a filter', async () => {

							const validPriorities = priority;
							const invalidPriority = 'GHI';

							req.query.priority = validPriorities.concat( [ invalidPriority ] );

							validators.isBarrierPriority.and.callFake( ( value ) => {

								if( validPriorities.includes( value ) ){ return true; }

								return false;
							} );

							await controller( req, res, next );

							expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, { priority: validPriorities } );
						} );
					} );
				} );

				describe( 'As a csv', () => {

					beforeEach( () => {
						priority = [ faker.lorem.word().toUpperCase(), faker.lorem.word().toUpperCase() ];
						req.query.priority = priority.join( ',' );
					} );

					describe( 'When all priorities are valid', () => {
						it( 'Should render the template with a filter', async () => {

							validators.isBarrierPriority.and.callFake( () => true );

							await controller( req, res, next );

							expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, { priority } );
						} );
					} );

					describe( 'When all priorities are NOT valid', () => {
						it( 'Should render the template without filters', async () => {

							validators.isBarrierPriority.and.callFake( () => false );

							await controller( req, res, next );

							expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, {} );
						} );
					} );

					describe( 'When one priority is valid and one is not', () => {
						it( 'Should render the template with a filter', async () => {

							const validPriorities = priority;
							const invalidPriority = faker.lorem.word().toUpperCase();

							req.query.priority = validPriorities.concat( [ invalidPriority ] ).join( ',' );

							validators.isBarrierPriority.and.callFake( ( value ) => {

								if( validPriorities.includes( value ) ){ return true; }

								return false;
							} );

							await controller( req, res, next );

							expect( backend.barriers.getAll ).toHaveBeenCalledWith( req, { priority: validPriorities } );
						} );
					} );
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
