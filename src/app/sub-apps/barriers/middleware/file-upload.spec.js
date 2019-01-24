const proxyquire = require( 'proxyquire' );
const modulePath = './file-upload';

let middleware;
let form;
let maxSize;
let reporter;
let req;
let res;
let next;

describe( 'file upload middleware', () => {

	beforeEach( () => {

		req = { body: {} };
		res = { myRes: true };
		next = jasmine.createSpy( 'next' );
		reporter = {
			captureException: jasmine.createSpy( 'reporter.captureException' ),
		};

		form = {
			on: jasmine.createSpy( 'form.on' ),
			parse: jasmine.createSpy( 'form.parse' ),
		};

		const config = {
			files: { maxSize }
		};

		const formidable = {
			IncomingForm: function(){ return form; }
		};

		middleware = proxyquire( modulePath, {
			'formidable': formidable,
			'../../../config': config,
			'../../../lib/reporter': reporter,
		} );
	} );

	it( 'Should setup the form', () => {

		middleware( req, res, next );

		expect( form.maxFileSize ).toEqual( maxSize );
		expect( form.on ).toHaveBeenCalledWith( 'error', reporter.captureException );
		const parseArgs = form.parse.calls.argsFor( 0 );
		expect( form.parse ).toHaveBeenCalled();
		expect( parseArgs[ 0 ] ).toEqual( req );
		expect( typeof parseArgs[ 1 ] ).toEqual( 'function' );
		expect( parseArgs[ 1 ].length ).toEqual( 3 );
	} );

	describe( 'form.parse', () => {

		let err;
		let fields;
		let files;
		let parse;

		beforeEach( () => {

			err = null;

			fields = {
				a: 1,
				b: 2,
			};

			files = {
				c: 3,
				d: 4,
			};

			middleware( req, res, next );
			parse = form.parse.calls.argsFor( 0 )[ 1 ];
		} );

		afterEach( () => {

			expect( next ).toHaveBeenCalledWith();
		} );

		function checkFields(){

			for( let prop in fields ){
				expect( req.body[ prop ] ).toEqual( fields[ prop ] );
			}
		}

		describe( 'When there is an error', () => {
			it( 'Should assign the error to the req and not add the files', () => {

				err = new Error( 'my error' );

				parse( err, fields, files );

				checkFields();

				expect( req.formError ).toEqual( err );

				for( let prop in files ){
					expect( req[ prop ] ).not.toBeDefined();
				}
			} );
		} );

		describe( 'When there is not an error', () => {
			it( 'Should assigns the files and fields', () => {

				parse( err, fields, files );

				checkFields();

				for( let prop in files ){
					expect( req.body[ prop ] ).toEqual( files[ prop ] );
				}

				expect( req.formError ).not.toBeDefined();
			} );
		} );
	} );
} );
