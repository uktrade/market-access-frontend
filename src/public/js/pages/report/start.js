ma.pages.report.start = (function( jessie ){

	return function(){

		if( !ma.components.ConditionalRadioContent || !jessie.query ){ return; }

		var conditionalElem = '.conditional-content';

		var conitionalItems = new ma.components.ConditionalRadioContent({
			inputContainer: '.problem-status',
			inputName: 'status',
			conditionalElem: conditionalElem,
			shouldShow: function( value ){ return ( value === '1' || value === '2' ); }
		});

		var extraInputs = jessie.query( conditionalElem + ' .govuk-radios__input' );

		conitionalItems.events.toggle.subscribe( function( isVisible ){

			var input;
			var i = 0;

			if( !isVisible ){
				while( ( input = extraInputs[ i++ ] ) ){
					input.checked = false;
				}
			}
		} );
	};
}( jessie ));
