const proxyquire = require( 'proxyquire' );
const faker = require( 'faker' );
const modulePath = './detail';

describe( 'Barrier detail view model', () => {
	// Add in the admin areas

	let viewModel;
	let metadata;
	let inputBarrier;
	let config;
	let strings;

	beforeEach( () => {

		inputBarrier = jasmine.helpers.getFakeData( '/backend/barriers/barrier' );

		metadata = {
			countries: [
				{ id: '1234', name: 'Fake Country Name' },
				{ id: faker.random.uuid(), name: faker.address.country() },
				{ id: faker.random.uuid(), name: faker.address.country() },
				{ id: faker.random.uuid(), name: faker.address.country() },
				{ id: faker.random.uuid(), name: faker.address.country() }
			],
			adminAreas: [
				{ id: '3456', name: 'Fake admin area 1', country: { name: 'Fake Country Name', id: '1234'} },
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
			getAdminArea: jasmine.createSpy('meta.getAdminArea'),
			getSector: jasmine.createSpy( 'metadata.getSector' ),
			barrierSource: {
				'COMPANY': 'company',
				'TRADE': 'trade',
				'OTHER': 'other'
			},
			barrierTypeCategories: {
				GOODS: 'some goods',
				SERVICES: 'some services'
			},
			optionalBool: {
				1: 'A',
				2: 'B',
				3: 'C'
			}
		};

		config = { addCompany: false };
		strings = jasmine.helpers.mocks.strings();

		metadata.getCountry.and.callFake( () => metadata.countries[ 3 ] );
		metadata.getSector.and.callFake( () => metadata.sectors[ 1 ] );
		metadata.getAdminArea.and.callFake( () => metadata.adminAreas[0]);

		viewModel = proxyquire( modulePath, {
			'../../../lib/metadata': metadata,
			'../../../config': config,
			'../../../lib/strings': strings,
		} );
	} );

	describe( 'With all the data on an open barrier', () => {
		it( 'Should create all the correct properties', () => {

			inputBarrier.current_status.status = 2;
			inputBarrier.problem_status = '2';

			const output = viewModel( inputBarrier );
			const outputBarrier = output.barrier;
			const barrierSectors = inputBarrier.sectors.map( metadata.getSector );

			expect( outputBarrier.id ).toEqual( inputBarrier.id );
			expect( outputBarrier.code ).toEqual( inputBarrier.code );
			expect( outputBarrier.title ).toEqual( inputBarrier.barrier_title );
			expect( outputBarrier.product ).toEqual( inputBarrier.product );
			expect( outputBarrier.problem.status ).toEqual( metadata.statusTypes[ inputBarrier.problem_status ] );
			expect( outputBarrier.problem.description ).toEqual( inputBarrier.problem_description );
			expect( outputBarrier.type ).toEqual( {
				id: inputBarrier.barrier_type.id,
				title: inputBarrier.barrier_type.title,
				description: inputBarrier.barrier_type.description,
				category: {
					id: inputBarrier.barrier_type.category,
					name: metadata.barrierTypeCategories[ inputBarrier.barrier_type.category ]
				}
			} );
			expect( outputBarrier.status ).toEqual( {
				name: 'Open',
				modifyer: 'assessment',
				date: inputBarrier.current_status.status_date,
				description: inputBarrier.current_status.status_summary
			} );
			expect( outputBarrier.reportedOn ).toEqual( inputBarrier.reported_on );
			expect( outputBarrier.addedBy ).toEqual( inputBarrier.reported_by );
			expect( outputBarrier.location ).toEqual( strings.location.response );
			expect( strings.location ).toHaveBeenCalledWith( inputBarrier.export_country, [] );
			expect( outputBarrier.sectors ).toEqual( barrierSectors );
			expect( outputBarrier.source ).toEqual( {
				id: inputBarrier.source,
				name: metadata.barrierSource[ inputBarrier.source ],
				description: inputBarrier.other_source
			} );
			expect( outputBarrier.legal ).toEqual( {
				hasInfringements: ( inputBarrier.has_legal_infringement == '1' ),
				unknownInfringements: ( inputBarrier.has_legal_infringement == '3' ),
				infringements: {
					wto: inputBarrier.wto_infringement,
					fta: inputBarrier.fta_infringement,
					other: inputBarrier.other_infringement
				},
				summary: inputBarrier.infringement_summary
			} );
			expect( outputBarrier.priority ).toEqual( { ...inputBarrier.priority, modifyer: inputBarrier.priority.code.toLowerCase() } );
			expect( outputBarrier.euExitRelated ).toEqual( 'A' );

			expect( output.sectorsList ).toEqual( barrierSectors.map( ( sector ) => ( { text: sector.name } ) ) );
			expect( output.companies ).toEqual( inputBarrier.companies );
			expect( output.companiesList ).toEqual( inputBarrier.companies.map( ( company ) => ( { text: company.name } ) ) );
		} );
	} );

	describe( 'With admin areas on an open barrier', () => {
		it( 'Should create all the correct properties', () => {

			inputBarrier.country_admin_areas = ['3456'];

			const output = viewModel( inputBarrier );
			const outputBarrier = output.barrier;

			expect( outputBarrier.location ).toEqual( strings.location.response );
			expect( strings.location ).toHaveBeenCalledWith( inputBarrier.export_country, inputBarrier.country_admin_areas );
		});
	});

	describe( 'With sectors missing on an open barrier', () => {
		it( 'Should create all the correct properties', () => {

			inputBarrier.current_status.status = 2;
			inputBarrier.sectors = null;

			const output = viewModel( inputBarrier );
			const outputBarrier = output.barrier;

			expect( outputBarrier.sectors ).toEqual( [] );
			expect( output.sectorsList ).toEqual( [] );

			expect( outputBarrier.isOpen ).toEqual( true );
			expect( outputBarrier.isResolved ).toEqual( false );
			expect( outputBarrier.isHibernated ).toEqual( false );
		} );
	} );

	describe( 'When getSector does not match the sector on an open barrier', () => {
		it( 'Should create all the correct properties', () => {

			metadata.getSector.and.callFake( () => null );

			inputBarrier.current_status.status = 2;
			inputBarrier.sectors = [ null ];

			const output = viewModel( inputBarrier );
			const outputBarrier = output.barrier;

			expect( outputBarrier.sectors ).toEqual( [ null ] );
			expect( output.sectorsList ).toEqual( [ { text: 'Unknown' } ] );
		} );
	} );

	describe( 'With barrier_type missing', () => {
		it( 'Should create all the correct properties', () => {

			inputBarrier.barrier_type = null;

			const output = viewModel( inputBarrier );
			const outputBarrier = output.barrier;

			expect( outputBarrier.type ).toEqual( null );
		} );
	} );

	describe( 'With companies missing', () => {
		it( 'Should create all the correct properties', () => {

			delete inputBarrier.companies;

			const output = viewModel( inputBarrier );
			const outputBarrier = output.barrier;

			expect( outputBarrier.companies ).toEqual();
		} );
	} );

	describe( 'A resolved barrier', () => {
		it( 'Should have the correct properties', () => {

			inputBarrier.current_status.status = 4;

			const output = viewModel( inputBarrier );
			const outputBarrier = output.barrier;

			expect( outputBarrier.status ).toEqual( {
				name: 'Resolved',
				modifyer: 'resolved',
				date: inputBarrier.current_status.status_date,
				description: inputBarrier.current_status.status_summary
			} );

			expect( outputBarrier.isOpen ).toEqual( false );
			expect( outputBarrier.isResolved ).toEqual( true );
			expect( outputBarrier.isHibernated ).toEqual( false );
		} );
	} );

	describe( 'A barrier with no eu exit relation', () => {
		it( 'Should have the correct properties', () => {

			inputBarrier.eu_exit_related = null;

			const output = viewModel( inputBarrier );
			const outputBarrier = output.barrier;

			expect( outputBarrier.euExitRelated ).toEqual( 'Unknown' );
		} );
	} );

	describe( 'When all sectors is selected', () => {
		it( 'Should have the correct properties', () => {
			inputBarrier.all_sectors = true;

			const output = viewModel( inputBarrier );
			
			const sectorsList = output.sectorsList;

			expect(sectorsList).toEqual([{ text: 'All sectors' }]);
		});
	});

	describe( 'A hibernated barrier', () => {
		it( 'Should have the correct properties', () => {

			inputBarrier.current_status.status = 5;

			const output = viewModel( inputBarrier );
			const outputBarrier = output.barrier;

			expect( outputBarrier.status ).toEqual( {
				name: 'Paused',
				modifyer: 'hibernated',
				date: inputBarrier.current_status.status_date,
				description: inputBarrier.current_status.status_summary
			} );

			expect( outputBarrier.isOpen ).toEqual( false );
			expect( outputBarrier.isResolved ).toEqual( false );
			expect( outputBarrier.isHibernated ).toEqual( true );
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
