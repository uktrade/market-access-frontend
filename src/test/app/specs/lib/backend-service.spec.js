const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = '../../../../app/lib/backend-service';

describe( 'Backend Service', () => {

	let token;
	let backend;
	let service;
	let req;

	beforeEach( () => {

		token = uuid();
		req = { session: { ssoToken: token } };
		backend = {
			get: jasmine.createSpy( 'backend.get' ),
			post: jasmine.createSpy( 'backend.post' ),
			put: jasmine.createSpy( 'backend.put' )
		};

		service = proxyquire( modulePath, {
			'./backend-request': backend
		} );
	} );

	describe( 'getUser', () => {
		it( 'Should call the correct path', () => {

			service.getUser( req );

			expect( backend.get ).toHaveBeenCalledWith( '/whoami/', token );
		} );
	} );

	describe( 'getMetadata', () => {
		it( 'Should call the correct path', () => {

			service.getMetadata();

			expect( backend.get ).toHaveBeenCalledWith( '/metadata/' );
		} );
	} );

	describe( 'getReports', () => {
		describe( 'When the results are an array', () => {
			it( 'Should call the correct path and sort the progress', async () => {

				backend.get.and.callFake( () => Promise.resolve( { response: { isSuccess: true }, body: jasmine.getFakeData( '/backend/reports/' ) } ) );

				const { body } = await service.getReports( req );

				expect( backend.get ).toHaveBeenCalledWith( '/reports/', token );
				expect( body.results[ 0 ].progress.map( ( item ) => item.stage_code ) ).toEqual( [ '1.3', '1.4', '1.4', '1.5', '2.4', '2.5', '3', '3.1' ] );
			} );
		} );

		describe( 'When the results are NOT an array', () => {
			it( 'Should call the correct path and NOT sort the progress', async () => {

				const responseBody = {
					"count": 1,
					"results": 'test'
				};

				backend.get.and.callFake( () => Promise.resolve( { response: { isSuccess: true }, body: responseBody } ) );

				await service.getReports( req );

				expect( backend.get ).toHaveBeenCalledWith( '/reports/', token );
			} );
		} );
	} );

	describe( 'getReport', () => {
		describe( 'When the response is a success', () => {
			it( 'Should call the correct path and sort the progress', () => {

				const reportId = 1;

				backend.get.and.callFake( () => Promise.resolve( { response: { isSuccess: true }, body: {} } ) );

				service.getReport( req, reportId );

				expect( backend.get ).toHaveBeenCalledWith( `/reports/${ reportId }/`, token );
			} );
		} );

		describe( 'When the response is not a success', () => {
			it( 'Should not sort the progress', () => {

				const reportId = 1;

				backend.get.and.callFake( () => Promise.resolve( { response: { isSuccess: false }, body: {} } ) );

				service.getReport( req, reportId );

				expect( backend.get ).toHaveBeenCalledWith( `/reports/${ reportId }/`, token );
			} );
		} );
	} );

	describe( 'saveNewReport', () => {
		describe( 'When the values are empty', () => {
			it( 'Should POST to the correct path with null values', () => {

				const company = { id: '', name: '' };
				const contactId = '';

				service.saveNewReport( req, { status: '', emergency: '' }, company, contactId );

				expect( backend.post ).toHaveBeenCalledWith( '/reports/', token, {
					problem_status: null,
					is_emergency: null,
					company_id: null,
					company_name: null,
					contact_id: null
				} );
			} );
		} );

		describe( 'When the values are not empty', () => {
			it( 'Should POST to the correct path with the values', () => {

				const status = 1;
				const emergency = 2;
				const company = { id: 3, name: 'test company' };
				const contactId = '123-abc';

				service.saveNewReport( req, { status, emergency }, company, contactId );

				expect( backend.post ).toHaveBeenCalledWith( '/reports/', token, {
					problem_status: status,
					is_emergency: emergency,
					company_id: company.id,
					company_name: company.name,
					contact_id: contactId
				} );
			} );
		} );
	} );

	describe( 'updateReport', () => {
		describe( 'When the values are empty', () => {
			it( 'Should PUT to the correct path with null values', () => {

				const company = { id: '', name: '' };
				const contactId = '';
				const reportId = '2';

				service.updateReport( req, reportId, { status: '', emergency: '' }, company, contactId );

				expect( backend.put ).toHaveBeenCalledWith( `/reports/${ reportId }/`, token, {
					problem_status: null,
					is_emergency: null,
					company_id: null,
					company_name: null,
					contact_id: null
				} );
			} );
		} );

		describe( 'When the values are not empty', () => {
			it( 'Should PUT to the correct path with the correct values', () => {

				const status = 1;
				const emergency = 2;
				const company = { id: 3, name: 'test company' };
				const contactId = '123-abc';
				const reportId = '2';

				service.updateReport( req, reportId, { status, emergency }, company, contactId );

				expect( backend.put ).toHaveBeenCalledWith( `/reports/${ reportId }/`, token, {
					problem_status: status,
					is_emergency: emergency,
					company_id: company.id,
					company_name: company.name,
					contact_id: contactId
				} );
			} );
		} );
	} );

	describe( 'saveProblem', () => {

		const reportId = '3';

		describe( 'When the values are empty', () => {
			it( 'Should PUT to the correct path with null values', () => {

				service.saveProblem( req, reportId, {
					item: '',
					commodityCode: '',
					country: '',
					description: '',
					impact: '',
					losses: '',
					otherCompanies: ''
				} );

				expect( backend.put ).toHaveBeenCalledWith( `/reports/${ reportId }/`, token, {
					product: null,
					commodity_codes: null,
					export_country: null,
					problem_description: null,
					problem_impact: null,
					estimated_loss_range: null,
					other_companies_affected: null
				} );
			} );
		} );

		describe( 'When the values are not empty', () => {
			it( 'Should PUT to the correct path with the correct values', () => {

				const item = '1';
				const commodityCode = '1, 2';
				const country = 'a';
				const description = 'b';
				const impact = 'c';
				const losses = 'd';
				const otherCompanies = 'e';

				service.saveProblem( req, reportId, {
					item,
					commodityCode,
					country,
					description,
					impact,
					losses,
					otherCompanies
				} );

				expect( backend.put ).toHaveBeenCalledWith( `/reports/${ reportId }/`, token, {
					product: item,
					commodity_codes: commodityCode.split( ', ' ),
					export_country: country,
					problem_description: description,
					problem_impact: impact,
					estimated_loss_range: losses,
					other_companies_affected: otherCompanies
				} );
			} );
		} );
	} );

	describe( 'saveNextSteps', () => {

		const reportId = '4';

		describe( 'When the valuea are empty', () => {
			it( 'Should PUT to the correct path with the correct values', () => {

				service.saveNextSteps( req, reportId, {
					response: '',
					sensitivities: '',
					sensitivitiesText: '',
					permission: ''
				} );

				expect( backend.put ).toHaveBeenCalledWith( `/reports/${ reportId }/`, token, {
					govt_response_requester: null,
					is_confidential: null,
					sensitivity_summary: null,
					can_publish: null
				} );
			} );
		} );

		describe( 'When the valuea are not empty', () => {
			it( 'Should PUT to the correct path with the correct values', () => {


				const response = '1';
				const sensitivities = '2';
				const sensitivitiesText = '3';
				const permission = '4';

				service.saveNextSteps( req, reportId, {
					response,
					sensitivities,
					sensitivitiesText,
					permission
				} );

				expect( backend.put ).toHaveBeenCalledWith( `/reports/${ reportId }/`, token, {
					govt_response_requester: response,
					is_confidential: sensitivities,
					sensitivity_summary: sensitivitiesText,
					can_publish: permission
				} );
			} );
		} );
	} );
} );
