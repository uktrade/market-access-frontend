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
		it( 'Should call the correct path', () => {

			service.getReports( req );

			expect( backend.get ).toHaveBeenCalledWith( '/reports/', token );
		} );
	} );

	describe( 'getReport', () => {
		it( 'Should call the correct path', () => {

			const reportId = 1;

			service.getReport( req, reportId );

			expect( backend.get ).toHaveBeenCalledWith( `/reports/${ reportId }/`, token );
		} );
	} );

	describe( 'saveNewReport', () => {
		it( 'Should POST to the correct path', () => {

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

	describe( 'updateReport', () => {
		it( 'Should POST to the correct path', () => {

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
