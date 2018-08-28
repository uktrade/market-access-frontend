const proxyquire = require( 'proxyquire' );
const faker = require( 'faker' );
const modulePath = './detail';

describe( 'Barrier detail view model', () => {

	let viewModel;
	let metadata;
	let inputBarrier;

	beforeEach( () => {

		inputBarrier = jasmine.helpers.intercept.stub( '/backend/barriers/barrier' );

		metadata = {
			countries: [
				{ id: faker.random.uuid(), name: faker.address.country() },
				{ id: faker.random.uuid(), name: faker.address.country() },
				{ id: faker.random.uuid(), name: faker.address.country() },
				{ id: faker.random.uuid(), name: faker.address.country() },
				{ id: faker.random.uuid(), name: faker.address.country() }
			]
		};

		viewModel = proxyquire( modulePath, {
			'../../../lib/metadata': metadata
		} );
	} );

	describe( 'With all the data on an open barrier', () => {
		it( 'Should create all the correct properties', () => {

			inputBarrier.report.export_country = metadata.countries[ 2 ].id;
			inputBarrier.current_status.status = 2;

			const output = viewModel( inputBarrier );
			const outpuBarrier = output.barrier;

			expect( outpuBarrier.id ).toEqual( inputBarrier.id );
			expect( outpuBarrier.title ).toEqual( inputBarrier.report.barrier_title );
			expect( outpuBarrier.summary ).toEqual( inputBarrier.summary );
			expect( outpuBarrier.type ).toEqual( inputBarrier.barrier_type );
			expect( outpuBarrier.status ).toEqual( { name: 'Open', modifyer: 'assessment' } );
			expect( outpuBarrier.reportedOn ).toEqual( inputBarrier.reported_on );
			expect( outpuBarrier.company ).toEqual( inputBarrier.report.company );
			expect( outpuBarrier.country ).toEqual( metadata.countries[ 2 ] );
			expect( outpuBarrier.sector ).toEqual( { id: inputBarrier.report.company.sector_id, name: inputBarrier.report.company.sector_name } );
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
		} );
	} );

	describe( 'A resolved barrier', () => {
		it( 'Should have the correct properties', () => {

			inputBarrier.current_status.status = 4;

			const output = viewModel( inputBarrier );
			const outpuBarrier = output.barrier;

			expect( outpuBarrier.title ).toBeUndefined();
			expect( outpuBarrier.status ).toEqual( { name: 'Resolved', modifyer: 'resolved' } );
		} );
	} );

	describe( 'A hibernated barrier', () => {
		it( 'Should have the correct properties', () => {

			inputBarrier.current_status.status = 5;

			const output = viewModel( inputBarrier );
			const outpuBarrier = output.barrier;

			expect( outpuBarrier.title ).toBeUndefined();
			expect( outpuBarrier.status ).toEqual( { name: 'Hibernated', modifyer: 'hibernated' } );
		} );
	} );
} );
