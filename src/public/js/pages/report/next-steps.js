ma.pages.report.nextSteps = (function( doc ){

	return function(){

		if( !ma.components.ConditionalRadioContent ){ return; }

		new ma.components.ConditionalRadioContent({
			inputContainer: '.step-sensitivities',
			inputName: 'sensitivities',
			conditionalElem: '#conditional-true',
			shouldShow: function( value ){ return ( value === 'true' ); }
		});
	};
}( document ));
