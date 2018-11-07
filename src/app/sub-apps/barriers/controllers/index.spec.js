const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

const modulePath = './index';

describe( 'Barriers controller', () => {

	let controller;
	let req;
	let res;
	let barrierDetailViewModel;
	let barrierId;
	let config;

	let edit;
	let type;
	let interactions;
	let status;
	let sectors;
	let companies;

	beforeEach( () => {

		barrierId = uuid();
		edit = jasmine.createSpy( 'edit' );
		type = jasmine.createSpy( 'type' );
		interactions = jasmine.createSpy( 'interactions' );
		status = jasmine.createSpy( 'status' );
		sectors = jasmine.createSpy( 'sectors' );
		companies = jasmine.createSpy( 'companies' );
		config = {};

		req = {
			barrier: {
				id: barrierId
			},
			session: {},
			params: {},
			query: {}
		};

		res = {
			render: jasmine.createSpy( 'res.render' ),
		};

		barrierDetailViewModel = jasmine.createSpy( 'barrierDetailViewModel' );

		controller = proxyquire( modulePath, {
			'../../../config': config,
			'../view-models/detail': barrierDetailViewModel,
			'./edit': edit,
			'./type': type,
			'./interactions': interactions,
			'./status': status,
			'./sectors': sectors,
			'./companies': companies,
		} );
	} );

	it( 'Should require the other controllers', () => {

		expect( controller.edit ).toEqual( edit );
		expect( controller.type ).toEqual( type );
		expect( controller.interactions ).toEqual( interactions );
		expect( controller.status ).toEqual( status );
		expect( controller.sectors ).toEqual( sectors );
	} );

	describe( 'Barrier', () => {

		let barierDetailViewModelResponse;

		beforeEach( () => {

			barierDetailViewModelResponse = { a: 1, b: 2 };

			barrierDetailViewModel.and.callFake( () => barierDetailViewModelResponse );
		} );

		function check( addCompany ){

			controller.barrier( req, res );

			expect( barrierDetailViewModel ).toHaveBeenCalledWith( req.barrier, addCompany );
			expect( res.render ).toHaveBeenCalledWith( 'barriers/views/detail', barierDetailViewModelResponse );
		}

		describe( 'With config.addCompany set to true', () => {

			beforeEach( () => {

				config.addCompany = true;
			} );

			describe( 'With no query', () => {
				it( 'Should render the barrier detail page with addCompany true', () => {

					check( true );
				} );
			} );

			describe( 'With query set to true', () => {
				it( 'Should render the barrier detail page with addCompany true', () => {

					req.query.addCompany = true;

					check( true );
				} );
			} );
		} );

		describe( 'With config.addCompany set to false', () => {

			beforeEach( () => {

				config.addCompany = false;
			} );

			describe( 'With no query', () => {
				it( 'Should render the barrier detail page with addCompany false', () => {

					check( false );
				} );
			} );

			describe( 'With query set to true', () => {
				it( 'Should render the barrier detail page with addCompany true', () => {

					req.query.addCompany = true;

					check( true );
				} );
			} );
		} );
	} );
} );
