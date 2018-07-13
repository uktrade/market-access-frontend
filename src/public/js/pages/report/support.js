ma.pages.report.support = function(){

	if( !ma.components.ConditionalRadioContent ){ return; }

	new ma.components.ConditionalRadioContent({
		inputContainer: '.resolved',
		inputName: 'resolved',
		conditionalElem: '#conditional-resolved-false',
		shouldShow: function( value ){ return ( value === 'false' ); }
	});

	new ma.components.ConditionalRadioContent({
		inputContainer: '.resolved',
		inputName: 'resolved',
		conditionalElem: '#conditional-resolved-true',
		shouldShow: function( value ){ return ( value === 'true' ); }
	});

	new ma.components.ConditionalRadioContent({
		inputContainer: '.political-sensitivities',
		inputName: 'politicalSensitivities',
		conditionalElem: '#conditional-political-sensitivities-true',
		shouldShow: function( value ){ return ( value === 'true' ); }
	});
};
