const proxyquire = require( 'proxyquire' );

const modulePath = './index';

describe( 'Barriers controller', () => {

	let controller;

	let edit;
	let types;
	let interactions;
	let status;
	let sectors;
	let companies;

	beforeEach( () => {

		edit = jasmine.createSpy( 'edit' );
		types = jasmine.createSpy( 'types' );
		interactions = jasmine.createSpy( 'interactions' );
		status = jasmine.createSpy( 'status' );
		sectors = jasmine.createSpy( 'sectors' );
		companies = jasmine.createSpy( 'companies' );

		controller = proxyquire( modulePath, {
			'./edit': edit,
			'./types': types,
			'./interactions': interactions,
			'./status': status,
			'./sectors': sectors,
			'./companies': companies,
		} );
	} );

	it( 'Should require the other controllers', () => {

		expect( controller.edit ).toEqual( edit );
		expect( controller.types ).toEqual( types );
		expect( controller.interactions ).toEqual( interactions );
		expect( controller.status ).toEqual( status );
		expect( controller.sectors ).toEqual( sectors );
	} );
} );
