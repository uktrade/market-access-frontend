const uuid = require( 'uuid/v4' );

if( typeof jasmine !== 'undefined' ){

	jasmine.helpers = jasmine.helpers || {};

	const mocks = {

		res: () => ({
			redirect: jasmine.createSpy( 'res.redirect' ),
			render: jasmine.createSpy( 'res.render' ),
			locals: {},
		}),

		req: () => ({
			query: {},
			session: {},
			params: {},
			user: {},
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
	};
}
