const proxyquire = require( 'proxyquire' );

const modulePath = './index';

describe( 'Barriers controller', () => {

	let controller;

	let edit;
	let type;
	let interactions;
	let status;
	let sectors;
	let companies;

	beforeEach( () => {

		edit = jasmine.createSpy( 'edit' );
		type = jasmine.createSpy( 'type' );
		interactions = jasmine.createSpy( 'interactions' );
		status = jasmine.createSpy( 'status' );
		sectors = jasmine.createSpy( 'sectors' );
		companies = jasmine.createSpy( 'companies' );

		controller = proxyquire( modulePath, {
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
} );
