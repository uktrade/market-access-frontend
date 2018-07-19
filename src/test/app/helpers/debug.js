let linstening = false;

if( typeof jasmine !== 'undefined' ){

	jasmine.helpers = jasmine.helpers || {};

	jasmine.helpers.debug = () => {

		if( !linstening ){

			process.on( 'warning', ( e ) => console.warn( e.stack ) );
			linstening = true;
		}
	};
}
