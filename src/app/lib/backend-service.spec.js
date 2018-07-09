const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = './backend-service';

const getFakeData = jasmine.helpers.getFakeData;

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

				backend.get.and.callFake( () => Promise.resolve( { response: { isSuccess: true }, body: getFakeData( '/backend/reports/' ) } ) );

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

				service.saveNewReport( req, {
					status: '',
					emergency: '',
					company,
					contactId
				} );

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

				service.saveNewReport( req, {
					status,
					emergency,
					company,
					contactId
				} );

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

	describe( 'PUTing data to the report', () => {

		let reportId;
		let path;

		beforeEach( () => {

			reportId = parseInt( Math.random() * 100, 10 );
			path = `/reports/${ reportId }/`;
		} );

		function checkWithAndWithoutValues( methodName, serviceData, backendData ){

			describe( 'With empty values', () => {
				it( 'Should use null for the values', () => {

					const emptyServiceData = {};
					const nullBackendData = {};

					for( let key of Object.keys( serviceData ) ){
						emptyServiceData[ key ] = '';
					}

					for( let key of Object.keys( backendData ) ){

						nullBackendData[ key ] = null;
					}

					service[ methodName ]( req, reportId, emptyServiceData );

					expect( backend.put ).toHaveBeenCalledWith( path, token, nullBackendData );
				} );
			} );

			describe( 'With non empty values', () => {
				it( 'Should use the values', () => {

				service[ methodName ]( req, reportId, serviceData );

				expect( backend.put ).toHaveBeenCalledWith( path, token, backendData );
				} );
			} );
		}

		describe( 'updateReport', () => {

			const status = 1;
			const emergency = 2;
			const company = { id: 3, name: 'test company' };
			const contactId = '123-abc';

			checkWithAndWithoutValues( 'updateReport', {
				status,
				emergency,
				company,
				contactId
			}, {
				problem_status: status,
				is_emergency: emergency,
				company_id: company.id,
				company_name: company.name,
				contact_id: contactId
			} );
		} );

		describe( 'saveProblem', () => {

			const item = '1';
			const commodityCode = '1, 2';
			const country = 'a';
			const description = 'b';
			const barrierTitle = 'c';

			checkWithAndWithoutValues( 'saveProblem', {
				item,
				commodityCode,
				country,
				description,
				barrierTitle
			}, {
				product: item,
				commodity_codes: commodityCode,
				export_country: country,
				problem_description: description,
				barrier_title: barrierTitle,
			} );
		} );

		describe( 'saveImpact', () => {

			const impact = '1';
			const losses = '2';
			const otherCompanies = '3';
			const otherCompaniesInfo = 'test';

			checkWithAndWithoutValues( 'saveImpact', {
				impact,
				losses,
				otherCompanies,
				otherCompaniesInfo
			}, {
				problem_impact: impact,
				estimated_loss_range: losses,
				other_companies_affected: otherCompanies,
				other_companies_info: otherCompaniesInfo
			} );
		} );

		describe( 'saveLegal', () => {

			const hasInfringed = 'true';
			const infringments = {
				wtoInfringment: 'true',
				ftaInfringment: '',
				otherInfringment: 'true'
			};
			const infringmentSummary = 'test';

			checkWithAndWithoutValues( 'saveLegal', {
				hasInfringed,
				infringments,
				infringmentSummary
			}, {
				has_legal_infringment: hasInfringed,
				wto_infingment: true,
				fta_infingment: false,
				other_infingment: true,
				infringment_summary: infringmentSummary
			} );
		} );

		describe( 'saveBarrierType', () => {

			const barrierType = '2';

			checkWithAndWithoutValues( 'saveBarrierType', { barrierType }, { barrier_type: barrierType } );
		} );

		describe( 'saveSupport', () => {

			const resolved = '1';
			const supportType = '2';
			const stepsTaken = '3';
			const politicalSensitivities = '1';
			const sensitivitiesDescription = 'test';

			checkWithAndWithoutValues( 'saveSupport', {
				resolved,
				supportType,
				stepsTaken,
				politicalSensitivities,
				sensitivitiesDescription
			}, {
				is_resolved: resolved,
				support_type: supportType,
				steps_taken: stepsTaken,
				is_politically_sensitive: politicalSensitivities,
				political_sensitivity_summary: sensitivitiesDescription
			} );
		} );

		describe( 'saveNextSteps', () => {

			const response = '1';
			const sensitivities = '2';
			const sensitivitiesText = '3';
			const permission = '4';

			checkWithAndWithoutValues( 'saveNextSteps', {
				response,
				sensitivities,
				sensitivitiesText,
				permission
			}, {
				govt_response_requester: response,
				is_commercially_sensitive: sensitivities,
				commercial_sensitivity_summary: sensitivitiesText,
				can_publish: permission
			} );
		} );
	} );
} );
