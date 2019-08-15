const uuid = require( 'uuid/v4' );
const faker = require( 'faker' );

function createBarrierSessionSpies( key ){

	const namespace = 'barrierSession.' + ( key ? ( key + '.' ) : '' );

	return {
		get: jasmine.createSpy( namespace + 'get' ),
		delete: jasmine.createSpy( namespace + 'delete' ),
		set: jasmine.createSpy( namespace + 'set' ),
		setIfNotAlready: jasmine.createSpy( namespace + 'setIfNotAlready' ),
	};
}

if( typeof jasmine !== 'undefined' ){

	jasmine.helpers = jasmine.helpers || {};

	const mocks = {

		res: () => ({
			redirect: jasmine.createSpy( 'res.redirect' ),
			render: jasmine.createSpy( 'res.render' ),
			locals: {},
			status: jasmine.createSpy( 'res.status' ),
			json: jasmine.createSpy( 'res.json' ),
		}),

		req: () => ({
			method: 'GET',
			query: {},
			session: {},
			params: {},
			user: {},
			watchList: {
				lists: [],
				add: jasmine.createSpy( 'req.watchList.add' ),
				update: jasmine.createSpy( 'req.watchList.update' ),
				remove: jasmine.createSpy( 'req.watchList.remove' ),
			},
			body: {},
			error: jasmine.createSpy( 'req.error' ),
			hasErrors: jasmine.createSpy( 'req.hasErrors' ),
			flash: jasmine.createSpy( 'req.flash' ),
		}),

		next: () => jasmine.createSpy( 'next' ),
	};

	jasmine.helpers.mocks = {

		...mocks,

		middleware: () => {

			const csrfToken = uuid();

			return {
				res: mocks.res(),
				req: {
					...mocks.req(),
					csrfToken: () => csrfToken,
				},
				next: mocks.next(),
				csrfToken,
			};
		},

		reporter: () => ({
			message: jasmine.createSpy( 'reporter.message' ),
			captureException: jasmine.createSpy( 'reporter.captureException' ),
		}),

		strings: () => {

			const methods = [ 'location', 'locations', 'types', 'sectors', 'regions', 'priorities', 'statuses', 'createdBy' ];
			const spies =  {};

			methods.forEach( ( name ) => {

				const spy = jasmine.createSpy( 'strings.' + name );
				const response = `${ name } ${ faker.lorem.word() }`;

				spy.and.callFake( () => response );
				spy.response = response;

				spies[ name ] = spy;
			} );

			return spies;
		},

		barrierFilters: () => {

			const getDisplayInfoSpy = jasmine.createSpy( 'barrierFilters.getDisplayInfo' );
			getDisplayInfoSpy.responses = {};
			getDisplayInfoSpy.and.callFake( ( key ) => {

				getDisplayInfoSpy.responses[ key ] = { label: faker.lorem.word(), text: faker.lorem.word() };

				return getDisplayInfoSpy.responses[ key ];
			} );

			const createListSpy = jasmine.createSpy( 'barrierFilters.createList' );
			createListSpy.response = [ { key: faker.lorem.word(), value: faker.lorem.word() } ];
			createListSpy.and.callFake( () => createListSpy.response );

			return {
				getDisplayInfo: getDisplayInfoSpy,
				createList: createListSpy,
				getFromQueryString: jasmine.createSpy( 'barrierFilters.getFromQueryString' ),
				areEqual: jasmine.createSpy( 'barrierFilters.areEqual' ),
			};
		},

		barrierSession: () => ({
			...createBarrierSessionSpies(),
			types: createBarrierSessionSpies( 'types' ),
			sectors: {
				list: createBarrierSessionSpies( 'list' ),
				all: createBarrierSessionSpies( 'all' ),
			}
		}),

		form: () => {

			const getValuesResponse = { value1: faker.lorem.word(), value2: faker.lorem.word() };
			const getTemplateValuesResponse = { template1: faker.lorem.word(), template2: faker.lorem.word() };
			const form = {
				getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ).and.returnValue( getTemplateValuesResponse ),
				getValues: jasmine.createSpy( 'form.getValues' ).and.returnValue( getValuesResponse ),
				validate: jasmine.createSpy( 'form.validate' ),
				hasErrors: jasmine.createSpy( 'form.hasErrors' ),
			};

			return {
				getValuesResponse,
				getTemplateValuesResponse,
				form,
				Form: jasmine.createSpy( 'Form' ).and.returnValue( form )
			};
		},
	};
}
