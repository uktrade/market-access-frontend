 if( typeof jasmine !== 'undefined' ){

	jasmine.helpers = jasmine.helpers || {};

	jasmine.helpers.mockLogger = {
		create: () => ({
			verbose: jasmine.createSpy( 'logger.verbose' ),
			debug: jasmine.createSpy( 'logger.debug' ),
			info: jasmine.createSpy( 'logger.info' ),
			warn: jasmine.createSpy( 'logger.warn' ),
			error: jasmine.createSpy( 'logger.error' ),
		})
	};
}
