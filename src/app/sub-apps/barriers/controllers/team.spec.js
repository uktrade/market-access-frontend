const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const HttpResponseError = require( '../../../lib/HttpResponseError' );
const modulePath = './team';

const { getFakeData, mocks } = jasmine.helpers;

describe( 'Team controller', () => {

	let controller;
	let req;
	let res;
	let next;
	let csrfToken;
	let detailViewModel;
	let detailViewModelResponse;
	let backend;
	let Form;
	let form;
	let getValuesResponse;
	let getTemplateValuesResponse;
	let reporter;
	let urls;
	let sso;

	beforeEach( () => {

		({ req, res, next, csrfToken } = mocks.middleware());
		({ Form, form, getValuesResponse, getTemplateValuesResponse } = mocks.form());

		req.barrier = getFakeData( '/backend/barriers/barrier' );
		detailViewModelResponse = { detail: 'view model' };
		detailViewModel = jasmine.createSpy( 'detailViewModel' ).and.returnValue( detailViewModelResponse );
		backend = {
			getSsoUser: jasmine.createSpy( 'backend.getSsoUser' ),
			barriers: {
				team: {
					add: jasmine.createSpy( 'backend.barriers.team.add' ),
					delete: jasmine.createSpy( 'backend.barriers.team.delete' ),
				}
			}
		};
		reporter = mocks.reporter();
		urls = {
			barriers: {
				team: {
					list: jasmine.createSpy( 'urls.barriers.team.list' ),
				}
			}
		};
		sso = {
			users: {
				search: jasmine.createSpy( 'sso.users.search' ),
			}
		};

		controller = proxyquire( modulePath, {
			'../view-models/detail': detailViewModel,
			'../../../lib/backend-service': backend,
			'../../../lib/Form': Form,
			'../../../lib/reporter': reporter,
			'../../../lib/urls': urls,
			'../../../lib/sso-api-service': sso,
		} );
	} );

	describe( '#list', () => {
		it( 'Renders the template', () => {

			controller.list( req, res );

			expect( res.render ).toHaveBeenCalledWith( 'barriers/views/team/list', detailViewModelResponse );
			expect( detailViewModel ).toHaveBeenCalledWith( req.barrier );
		} );
	} );

	describe( '#add', () => {

		function checkRender( member, error ){

			expect( res.render ).toHaveBeenCalledWith( 'barriers/views/team/add', {
				...getTemplateValuesResponse,
				...detailViewModelResponse,
				member,
				error,
			} );

			expect( next ).not.toHaveBeenCalled();
		}

		describe( 'When there is a member id', () => {

			let memberId;

			beforeEach( () => {

				memberId = uuid();
				req.query.user = memberId;
			} );

			describe( 'When getSsoUser has an error', () => {
				it( 'Calls next with the error', async () => {

					const err = new Error( 'getSsoUser fail' );

					backend.getSsoUser.and.callFake( () => Promise.reject( err ) );

					await controller.add( req, res, next );

					expect( next ).toHaveBeenCalledWith( err );
					expect( res.render ).not.toHaveBeenCalled();
				} );
			} );

			describe( 'When getSsoUser is not a success', () => {
				it( 'Calls next with an error', async () => {

					backend.getSsoUser.and.callFake( () => Promise.resolve( {
						response: { isSuccess: false },
					} ) );

					await controller.add( req, res, next );

					expect( next ).toHaveBeenCalled();
					expect( next.calls.argsFor( 0 )[ 0 ] instanceof HttpResponseError ).toEqual( true );
					expect( res.render ).not.toHaveBeenCalled();
				} );
			} );

			describe( 'When getSsoUser is a success', () => {
				it( 'Adds the member to locals', async () => {

					const member = getFakeData( '/sso/user/user' );

					backend.getSsoUser.and.callFake( () => Promise.resolve( {
						response: { isSuccess: true },
						body: member,
					} ) );

					await controller.add( req, res, next );

					const [ formReq, formConfig ] = Form.calls.argsFor( 0 );

					expect( Form ).toHaveBeenCalled();
					expect( formReq ).toEqual( req );
					expect( formConfig ).toEqual( {
						memberId: {},
						role: {
							required: 'Enter a role'
						}
					} );

					checkRender( {
						id: member.user_id,
						name: `${ member.first_name } ${ member.last_name }`,
						email: member.email,
					} );
				} );
			} );
		} );

		describe( 'When there is not a member id', () => {

			afterEach( () => {

				const [ formReq, formConfig ] = Form.calls.argsFor( 0 );

				expect( Form ).toHaveBeenCalled();
				expect( formReq ).toEqual( req );
				expect( formConfig ).toEqual( {
					memberId: {
						required: 'Select a user to add'
					},
					role: {
						required: 'Enter a role'
					}
				} );
			} );

			describe( 'When it is a GET', () => {
				it( 'Renders the template', async () => {

					await controller.add( req, res, next );

					checkRender();
				} );
			} );

			describe( 'a POST', () => {

				beforeEach( () => {

					form.isPost = true;
				} );

				describe( 'With validation errors', () => {
					it( 'Renders the template (to show an error message)', async () => {

						form.hasErrors.and.returnValue( true );

						await controller.add( req, res, next );

						checkRender();
					} );
				} );

				describe( 'Without validation errors', () => {

					beforeEach( () => {

						form.hasErrors.and.returnValue( false );
					} );

					afterEach( () => {

						expect( backend.barriers.team.add ).toHaveBeenCalledWith( req, req.barrier.id, getValuesResponse );
					} );

					describe( 'When the backend has an error', () => {
						it( 'Calls next with the error', async () => {

							const err = new Error( 'backend error' );

							backend.barriers.team.add.and.callFake( () => Promise.reject( err ) );

							await controller.add( req, res, next );

							expect( next ).toHaveBeenCalledWith( err );
							expect( res.render ).not.toHaveBeenCalled();
						} );
					} );

					describe( 'When the response is not a success', () => {
						describe( 'When it is a 400 status code', () => {
							it( 'Sets the error and reports it', async () => {

								const response = { isSuccess: false, a: 1, statusCode: 400 };
								const body = 'Some error here';

								const error = 'The user is already a member of the team';
								let member;

								backend.barriers.team.add.and.callFake( () => Promise.resolve( { response, body } ) );

								await controller.add( req, res, next );

								expect( reporter.message ).toHaveBeenCalledWith( 'error', 'User is already a member of the team', {
									member,
									barrierId: req.barrier.id,
									response,
									body,
								} );

								checkRender( member, error );
							} );
						} );

						describe( 'When it is a 500 status code', () => {
							it( 'Sets the error and reports it', async () => {

								const response = { isSuccess: false, a: 1, statusCode: 500 };
								const body = 'Some error here';

								const error = 'There was an error adding the user, try again';
								let member;

								backend.barriers.team.add.and.callFake( () => Promise.resolve( { response, body } ) );

								await controller.add( req, res, next );

								expect( reporter.message ).toHaveBeenCalledWith( 'error', 'Unable to add user to team', {
									member,
									barrierId: req.barrier.id,
									response,
									body,
								} );

								checkRender( member, error );
							} );
						} );
					} );

					describe( 'When the response is a success', () => {
						it( 'Redirects to the team list page', async () => {

							const listUrlResponse = '/a/url/for/list';

							urls.barriers.team.list.and.returnValue( listUrlResponse );

							backend.barriers.team.add.and.callFake( () => Promise.resolve({
								response: { isSuccess: true },
							}) );

							await controller.add( req, res, next );

							expect( res.redirect ).toHaveBeenCalledWith( listUrlResponse );
							expect( urls.barriers.team.list ).toHaveBeenCalledWith( req.barrier.id );
							expect( next ).not.toHaveBeenCalled();
						} );
					} );
				} );
			} );
		} );
	} );

	describe( '#search', () => {

		const template = 'barriers/views/team/search';

		afterEach( () => {

			const [ formReq, formConfig ] = Form.calls.argsFor( 0 );

			expect( Form ).toHaveBeenCalled();
			expect( formReq ).toEqual( req );
			expect( formConfig ).toEqual( {
				query: {}
			});
		} );

		describe( 'A GET', () => {
			it( 'Renders the template', async () => {

				await controller.search( req, res, next );

				expect( res.render ).toHaveBeenCalledWith( template, {
					...getTemplateValuesResponse,
					users: undefined,
					error: undefined,
				} );
			} );
		} );

		describe( 'A POST', () => {

			beforeEach( () => {

				form.isPost = true;
			} );

			describe( 'When there are errors', () => {
				it( 'Renders the tempalte', async () => {

					form.hasErrors.and.returnValue( true );

					await controller.search( req, res, next );

					expect( res.render ).toHaveBeenCalledWith( template, {
						...getTemplateValuesResponse,
						users: undefined,
						error: undefined,
					} );
				} );
			} );

			describe( 'when there are no errors', () => {
				describe( 'When the sso search errors', () => {
					it( 'Calls next with the error', async () => {

						const err = new Error( 'SSO error' );

						sso.users.search.and.returnValue( Promise.reject( err ) );

						await controller.search( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
						expect( res.render ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'When the SSO response is not a success', () => {
					it( 'Calls next with an error', async () => {

						sso.users.search.and.returnValue( Promise.resolve( {
							response: { isSuccess: false, response: true },
							body: 'Some SSO error'
						} ) );

						await controller.search( req, res, next );

						const err = next.calls.argsFor( 0 )[ 0 ];
						expect( next ).toHaveBeenCalled();
						expect( err instanceof HttpResponseError ).toEqual( true );
						expect( res.render ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'When the response is a success', () => {
					it( 'Alters the users and passes them to the template', async () => {

						const users = getFakeData( '/sso/user/users' );
						const expectedUsers = users.results.map( ( user ) => ({
							id: user.user_id,
							name: `${ user.first_name } ${ user.last_name }`,
							email: user.email,
						}) );

						sso.users.search.and.returnValue( Promise.resolve( {
							response: { isSuccess: true },
							body: users,
						} ) );

						await controller.search( req, res, next );

						expect( res.render ).toHaveBeenCalledWith( template, {
							...getTemplateValuesResponse,
							users: expectedUsers,
							error: undefined,
						} );
					} );
				} );
			} );
		} );
	} );

	describe( '#delete', () => {

		beforeEach( () => {

			req.members = [];
		} );

		describe( 'When a matching member is not found', () => {
			it( 'Calls next with an error', () => {

				controller.delete( req, res, next );

				expect( next ).toHaveBeenCalledWith( new Error( 'No matching team member found' ) );
				expect( res.render ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'With a matching member', () => {

			let member;

			beforeEach( () => {

				const members = getFakeData( '/backend/barriers/members' ).results;

				member = members[ 1 ];
				req.params.memberId = String( member.id );
				req.members = members;
			} );

			describe( 'A GET', () => {
				describe( 'An XHR request', () => {
					it( 'Renders the modal partial', () => {

						req.xhr = true;

						controller.delete( req, res, next );

						expect( res.render ).toHaveBeenCalledWith( 'barriers/views/partials/delete-team-member-modal', {
							barrierId: req.barrier.id,
							member,
							csrfToken,
						} );
						expect( next ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'A non XHR request', () => {
					it( 'Renders the template', () => {

						controller.delete( req, res, next );

						expect( res.render ).toHaveBeenCalledWith( 'barriers/views/team/list', {
							...detailViewModelResponse,
							isDelete: true,
							csrfToken,
							deleteMember: member,
						} );
						expect( detailViewModel ).toHaveBeenCalledWith( req.barrier );
					} );
				} );
			} );

			describe( 'A POST', () => {

				beforeEach( () => {

					req.method = 'POST';
				} );

				describe( 'When the backend errors', () => {
					it( 'Calls next with the error', async () => {

						const err = new Error( 'backend err' );

						backend.barriers.team.delete.and.returnValue( Promise.reject( err ) );

						await controller.delete( req, res, next );

						expect( next ).toHaveBeenCalledWith( err );
						expect( res.render ).not.toHaveBeenCalled();
					} );
				} );

				describe( 'When the backend call is not a success', () => {
					it( 'Calls next with an error', async () => {

						backend.barriers.team.delete.and.returnValue( Promise.resolve( {
							response: { isSuccess: false },
						} ) );

						await controller.delete( req, res, next );

						expect( next ).toHaveBeenCalled();
						expect( next.calls.argsFor( 0 )[ 0 ] instanceof HttpResponseError ).toEqual( true );
					} );
				} );

				describe( 'When the backend call is a success', () => {
					it( 'Redirect back to the list', async () => {

						const listUrlResponse = 'a/test/response';

						urls.barriers.team.list.and.returnValue( listUrlResponse );

						backend.barriers.team.delete.and.returnValue( Promise.resolve( {
							response: { isSuccess: true },
						} ) );

						await controller.delete( req, res, next );

						expect( res.redirect ).toHaveBeenCalledWith( listUrlResponse );
						expect( urls.barriers.team.list ).toHaveBeenCalledWith( req.barrier.id );
						expect( next ).not.toHaveBeenCalled();
					} );
				} );
			} );
		} );
	} );
} );
