const proxyquire = require( 'proxyquire' );
const faker = require( 'faker' );
const modulePath = './detail';

describe( 'Barrier detail view model', () => {

	let viewModel;
	let metadata;
	let inputBarrier;

	beforeEach( () => {

		inputBarrier = jasmine.helpers.getFakeData( '/backend/barriers/barrier' );

		metadata = {
			countries: [
				{ id: faker.random.uuid(), name: faker.address.country() },
				{ id: faker.random.uuid(), name: faker.address.country() },
				{ id: faker.random.uuid(), name: faker.address.country() },
				{ id: faker.random.uuid(), name: faker.address.country() },
				{ id: faker.random.uuid(), name: faker.address.country() }
			],
			sectors: [
				{ id: faker.random.uuid(), name: faker.lorem.words() },
				{ id: faker.random.uuid(), name: faker.lorem.words() },
				{ id: faker.random.uuid(), name: faker.lorem.words() }
			],
			getCountry: jasmine.createSpy( 'metadata.getCountry' ),
			getSector: jasmine.createSpy( 'metadata.getSector' )
		};

		metadata.getCountry.and.callFake( () => metadata.countries[ 3 ] );
		metadata.getSector.and.callFake( () => metadata.sectors[ 1 ] );

		viewModel = proxyquire( modulePath, {
			'../../../lib/metadata': metadata
		} );
	} );

	describe( 'With all the data on an open barrier', () => {
		it( 'Should create all the correct properties', () => {

			inputBarrier.current_status.status = 2;

			const output = viewModel( inputBarrier );
			const outpuBarrier = output.barrier;
			const barrierSectors = inputBarrier.sectors.map( metadata.getSector );

			expect( outpuBarrier.id ).toEqual( inputBarrier.id );
			expect( outpuBarrier.title ).toEqual( inputBarrier.barrier_title );
			expect( outpuBarrier.summary ).toEqual( inputBarrier.summary );
			expect( outpuBarrier.type ).toEqual( inputBarrier.barrier_type );
			expect( outpuBarrier.status ).toEqual( { name: 'Open', modifyer: 'assessment' } );
			expect( outpuBarrier.reportedOn ).toEqual( inputBarrier.reported_on );
			expect( outpuBarrier.country ).toEqual( metadata.getCountry( inputBarrier.export_country ) );
			expect( outpuBarrier.sectors ).toEqual( barrierSectors );
			expect( outpuBarrier.legal ).toEqual( {
				hasInfringements: ( inputBarrier.has_legal_infringement == '1' ),
				unknownInfringements: ( inputBarrier.has_legal_infringement == '3' ),
				infringements: {
					wto: inputBarrier.wto_infringement,
					fta: inputBarrier.fta_infringement,
					other: inputBarrier.other_infringement
				},
				summary: inputBarrier.infringement_summary
			} );

			expect( output.sectorsList ).toEqual( barrierSectors.map( ( sector ) => ( { text: sector.name } ) ) );
		} );
	} );

	describe( 'A resolved barrier', () => {
		it( 'Should have the correct properties', () => {

			inputBarrier.current_status.status = 4;

			const output = viewModel( inputBarrier );
			const outpuBarrier = output.barrier;

			expect( outpuBarrier.status ).toEqual( { name: 'Resolved', modifyer: 'resolved' } );
		} );
	} );

	describe( 'A hibernated barrier', () => {
		it( 'Should have the correct properties', () => {

			inputBarrier.current_status.status = 5;

			const output = viewModel( inputBarrier );
			const outpuBarrier = output.barrier;

			expect( outpuBarrier.status ).toEqual( { name: 'Hibernated', modifyer: 'hibernated' } );
		} );
	} );
} );
