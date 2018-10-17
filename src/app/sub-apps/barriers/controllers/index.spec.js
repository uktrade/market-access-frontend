const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );

const modulePath = './index';

describe( 'Barriers controller', () => {

	let controller;
	let req;
	let res;
	let barrierDetailViewModel;
	let barrierId;

	let type;
	let interactions;
	let status;
	let sectors;
	let companies;

	beforeEach( () => {

		barrierId = uuid();
		type = jasmine.createSpy( 'type' );
		interactions = jasmine.createSpy( 'interactions' );
		status = jasmine.createSpy( 'status' );
		sectors = jasmine.createSpy( 'sectors' );
		companies = jasmine.createSpy( 'companies' );

		req = {
			barrier: {
				id: barrierId
			},
			session: {},
			params: {}
		};
		res = {
			render: jasmine.createSpy( 'res.render' ),
			redirect: jasmine.createSpy( 'res.redirect' )
		};

		barrierDetailViewModel = jasmine.createSpy( 'barrierDetailViewModel' );

		controller = proxyquire( modulePath, {
			'../view-models/detail': barrierDetailViewModel,
			'./type': type,
			'./interactions': interactions,
			'./status': status,
			'./sectors': sectors,
			'./companies': companies,
		} );
	} );

	it( 'Should require the other controllers', () => {

		expect( controller.type ).toEqual( type );
		expect( controller.interactions ).toEqual( interactions );
		expect( controller.status ).toEqual( status );
		expect( controller.sectors ).toEqual( sectors );
	} );

	describe( 'Barrier', () => {
		it( 'Should render the barrier detail page', () => {

			const barierDetailViewModelResponse = { a: 1, b: 2 };

			barrierDetailViewModel.and.callFake( () => barierDetailViewModelResponse );

			controller.barrier( req, res );

			expect( barrierDetailViewModel ).toHaveBeenCalledWith( req.barrier );
			expect( res.render ).toHaveBeenCalledWith( 'barriers/views/detail', barierDetailViewModelResponse );
		} );
	} );
} );
