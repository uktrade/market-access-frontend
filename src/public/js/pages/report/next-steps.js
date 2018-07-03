ma.pages.report.nextSteps = (function( doc ){

	return function(){

		if( !ma.components.ConditionalRadioContent ){ return; }

		var conditional = new ma.components.ConditionalRadioContent({
			inputContainer: '.step-sensitivities',
			inputName: 'sensitivities',
			conditionalElem: '.conditional-content',
			shouldShow: function( value ){ return ( value === 'true' ); }
		});

		var description = doc.getElementById( 'sensitivities-text' );

		conditional.events.toggle.subscribe( function( isVisible ){

			if( description && !isVisible ){
				description.value = '';
			}
		} );
	};
}( document ));
