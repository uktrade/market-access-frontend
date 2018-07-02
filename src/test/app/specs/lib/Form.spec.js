const proxyquire = require( 'proxyquire' );
const uuid = require( 'uuid/v4' );
const modulePath = '../../../../app/lib/Form';

describe( 'Form', () => {

	let Form;
	let form;
	let req;
	let fields;
	let validators;
	let csrfToken;

	beforeEach( () => {

		csrfToken = uuid();
		req = {
			csrfToken: () => csrfToken
		};
		fields = {};

		validators = {
			isDefined: jasmine.createSpy( 'validators.isDefined' )
		};

		Form = proxyquire( modulePath, {
			'./validators': validators
		} );
	} );

	describe( 'When the request is a POST', () => {

		beforeEach( () => {

			req.method = 'POST';
			req.body = {};
		} );

		describe( 'Setup', () => {

			beforeEach( () => {

				req.body = {
					test: 'value-1',
					another: 'another-1',
					unknown: 'unknown-1'
				};

				fields = {
					test: {
						values: [ 'value-2' ],
						required: 'Test required message'
					},
					another: {
						values: [ 'another-2' ],
						required: 'Test another required message'
					}
				};
			} );

			describe( 'When the action is exit', () => {
				it( 'Should set isPost and isExit to true', () => {

					req.body.action = 'exit';

					form = new Form( req, fields );

					expect( form.isPost ).toEqual( true );
					expect( form.isExit ).toEqual( true );
				} );
			} );

			it( 'Should put the field names in an internal array and the body values in an internal array', () => {

				const keys = Object.keys( fields );

				form = new Form( req, fields );

				expect( form.fieldNames.length ).toEqual( keys.length );

				for( let name of keys ){
					expect( form.fieldNames.includes( name ) ).toEqual( true );
					expect( form.values[ name ] ).toEqual( req.body[ name ] );
				}
			} );

			describe( 'Getting the values', () => {
				it( 'Should return the values', () => {

					expect( form.getValues() ).toEqual( {
						test: 'value-1',
						another: 'another-1'
					} );
				} );
			} );
		} );

		describe( 'Validation', () => {
			describe( 'Without conditionals', () => {
				describe( 'When there are errors', () => {
					it( 'Should return true when hasErrors is called after validation', () => {

						validators.isDefined.and.callFake( () => false );

						const requiredMessage = 'a test message';

						fields = {
							test: {
								required: requiredMessage
							}
						};

						form = new Form( req, fields );

						form.validate();

						expect( form.hasErrors() ).toEqual( true );
						expect( form.errors.length ).toEqual( 1 );
						expect( form.errors ).toEqual( [
							{
								id: 'test',
								message: requiredMessage
							}
						] );
						expect( form.getTemplateErrors() ).toEqual( [
							{
								href: '#test',
								text: requiredMessage
							}
						] );
					} );
				} );
			} );

			describe( 'With conditionals', () => {

				beforeEach( () => {

					fields = {
						testName: {},
						another: {
							conditional: { name: 'testName', value: 'fred' },
							required: 'A required message'
						}
					};
				} );

				describe( 'When the conditionals pass', () => {
					it( 'Should not have any errors', () => {

						req.body = {
							testName: 'fred',
							another: 'test value'
						};

						form = new Form( req, fields );

						form.validate();

						expect( form.hasErrors() ).toEqual( true );
					} );
				} );

				describe( 'When the conditionals fail', () => {
					it( 'Should not have errors', () => {

						req.body = {
							testName: '',
							another: 'test value'
						};

						form = new Form( req, fields );

						form.validate();

						expect( form.hasErrors() ).toEqual( false );
					} );
				} );
			} );
		} );
	} );

	describe( 'When the request is a GET', () => {

		beforeEach( () => {

			req.method = 'GET';
		} );

		describe( 'Setup', () => {
			it( 'Should set isPost to false', () => {

				fields = {
					test: {
						required: 'A message'
					}
				};

				form = new Form( req, fields );

				expect( form.isPost ).toEqual( false );
			} );
		} );

		describe( 'getTemplateValues', () => {
			it( 'Should return the correct values', () => {

				fields = {
					radio: {
						type: Form.RADIO,
						items: [ { value: '1', text: 'text 1' }, { value: '2', 'text': 'text 2' } ],
						values: [ '2' ]
					},
					select: {
						type: Form.SELECT,
						items: [ { value: 'a', text: 'value 1' }, { value: 'b', text: 'value b' } ],
						values: [ 'a' ]
					},
					text: {
						values: [ 'a text string' ]
					}
				};

				form = new Form( req, fields );

				expect( form.getTemplateValues() ).toEqual( {
					csrfToken,
					radio: [
						{ value: '1', text: 'text 1', checked: false },
						{ value: '2', text: 'text 2', checked: true }
					],
					select: [
						{ value: 'a', text: 'value 1', selected: true },
						{ value: 'b', text: 'value b', selected: false }
					],
					text: 'a text string'
				} );
			} );
		} );
	} );
} );
