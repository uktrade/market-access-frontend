const proxyquire = require( 'proxyquire' );
const faker = require( 'faker' );
const modulePath = './detail';

describe( 'Barrier detail view model', () => {

	let viewModel;
	let metadata;
	let inputBarrier;
	let config;

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
			statusTypes: {
				'1': 'Problem status one',
				'2': 'Problem status two'
			},
			getCountry: jasmine.createSpy( 'metadata.getCountry' ),
			getSector: jasmine.createSpy( 'metadata.getSector' ),
			barrierSource: {
				'COMPANY': 'company',
				'TRADE': 'trade',
				'OTHER': 'other'
			},
			barrierTypeCategories: {
				GOODS: 'some goods',
				SERVICES: 'some services'
			}
		};

		config = { addCompany: false };

		metadata.getCountry.and.callFake( () => metadata.countries[ 3 ] );
		metadata.getSector.and.callFake( () => metadata.sectors[ 1 ] );

		viewModel = proxyquire( modulePath, {
			'../../../lib/metadata': metadata,
			'../../../config': config
		} );
	} );

	describe( 'With all the data on an open barrier', () => {
		it( 'Should create all the correct properties', () => {

			inputBarrier.current_status.status = 2;
			inputBarrier.problem_status = '2';

			const output = viewModel( inputBarrier );
			const outpuBarrier = output.barrier;
			const barrierSectors = inputBarrier.sectors.map( metadata.getSector );

			expect( outpuBarrier.id ).toEqual( inputBarrier.id );
			expect( outpuBarrier.title ).toEqual( inputBarrier.barrier_title );
			expect( outpuBarrier.product ).toEqual( inputBarrier.product );
			expect( outpuBarrier.problem.status ).toEqual( metadata.statusTypes[ inputBarrier.problem_status ] );
			expect( outpuBarrier.problem.description ).toEqual( inputBarrier.problem_description );
			expect( outpuBarrier.type ).toEqual( {
				id: inputBarrier.barrier_type.id,
				title: inputBarrier.barrier_type.title,
				description: inputBarrier.barrier_type.description,
				category: {
					id: inputBarrier.barrier_type.category,
					name: metadata.barrierTypeCategories[ inputBarrier.barrier_type.category ]
				}
			} );
			expect( outpuBarrier.status ).toEqual( {
				name: 'Open',
				modifyer: 'assessment',
				date: inputBarrier.current_status.status_date,
				description: inputBarrier.current_status.status_summary
			} );
			expect( outpuBarrier.reportedOn ).toEqual( inputBarrier.reported_on );
			expect( outpuBarrier.reportedBy ).toEqual( inputBarrier.reported_by );
			expect( outpuBarrier.country ).toEqual( metadata.getCountry( inputBarrier.export_country ) );
			expect( outpuBarrier.sectors ).toEqual( barrierSectors );
			expect( outpuBarrier.source ).toEqual( {
				id: inputBarrier.source,
				name: metadata.barrierSource[ inputBarrier.source ],
				description: inputBarrier.other_source
			} );
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
			expect( output.companies ).toEqual( inputBarrier.companies );
			expect( output.companiesList ).toEqual( inputBarrier.companies.map( ( company ) => ( { text: company.name } ) ) );
		} );
	} );

	describe( 'With sectors missing on an open barrier', () => {
		it( 'Should create all the correct properties', () => {

			inputBarrier.current_status.status = 2;
			inputBarrier.sectors = null;

			const output = viewModel( inputBarrier );
			const outpuBarrier = output.barrier;

			expect( outpuBarrier.sectors ).toEqual( [] );
			expect( output.sectorsList ).toEqual( [] );

			expect( outpuBarrier.isOpen ).toEqual( true );
			expect( outpuBarrier.isResolved ).toEqual( false );
			expect( outpuBarrier.isHibernated ).toEqual( false );
		} );
	} );

	describe( 'When getSector does not match the sector on an open barrier', () => {
		it( 'Should create all the correct properties', () => {

			metadata.getSector.and.callFake( () => null );

			inputBarrier.current_status.status = 2;
			inputBarrier.sectors = [ null ];

			const output = viewModel( inputBarrier );
			const outpuBarrier = output.barrier;

			expect( outpuBarrier.sectors ).toEqual( [ null ] );
			expect( output.sectorsList ).toEqual( [ { text: 'Unknown' } ] );
		} );
	} );

	describe( 'With barrier_type missing', () => {
		it( 'Should create all the correct properties', () => {

			inputBarrier.barrier_type = null;

			const output = viewModel( inputBarrier );
			const outpuBarrier = output.barrier;

			expect( outpuBarrier.type ).toEqual( null );
		} );
	} );

	describe( 'With companies missing', () => {
		it( 'Should create all the correct properties', () => {

			delete inputBarrier.companies;

			const output = viewModel( inputBarrier );
			const outpuBarrier = output.barrier;

			expect( outpuBarrier.companies ).toEqual();
		} );
	} );

	describe( 'A resolved barrier', () => {
		it( 'Should have the correct properties', () => {

			inputBarrier.current_status.status = 4;

			const output = viewModel( inputBarrier );
			const outpuBarrier = output.barrier;

			expect( outpuBarrier.status ).toEqual( {
				name: 'Resolved',
				modifyer: 'resolved',
				date: inputBarrier.current_status.status_date,
				description: inputBarrier.current_status.status_summary
			} );

			expect( outpuBarrier.isOpen ).toEqual( false );
			expect( outpuBarrier.isResolved ).toEqual( true );
			expect( outpuBarrier.isHibernated ).toEqual( false );
		} );
	} );

	describe( 'A hibernated barrier', () => {
		it( 'Should have the correct properties', () => {

			inputBarrier.current_status.status = 5;

			const output = viewModel( inputBarrier );
			const outpuBarrier = output.barrier;

			expect( outpuBarrier.status ).toEqual( {
				name: 'Paused',
				modifyer: 'hibernated',
				date: inputBarrier.current_status.status_date,
				description: inputBarrier.current_status.status_summary
			} );

			expect( outpuBarrier.isOpen ).toEqual( false );
			expect( outpuBarrier.isResolved ).toEqual( false );
			expect( outpuBarrier.isHibernated ).toEqual( true );
		} );
	} );

	describe( 'addCompany flag', () => {
		describe( 'When it is true', () => {
			it( 'Should set addCompany to true', () => {

				const output = viewModel( inputBarrier, true );

				expect( output.addCompany ).toEqual( true );
			} );
		} );

		describe( 'When it is false', () => {
			it( 'Should set addCompany to true', () => {

				const output = viewModel( inputBarrier, false );

				expect( output.addCompany ).toEqual( false );
			} );
		} );
	} );
} );
