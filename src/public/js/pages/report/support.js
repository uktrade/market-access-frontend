ma.pages.report.support = function(){

	if( !ma.components.ConditionalRadioContent ){ return; }

	new ma.components.ConditionalRadioContent({
		inputContainer: '.resolved',
		inputName: 'resolved',
		conditionalElem: '#resolved-conditional',
		shouldShow: function( value ){ return ( value === 'true' ); }
	});

	new ma.components.ConditionalRadioContent({
		inputContainer: '.political-sensitivities',
		inputName: 'politicalSensitivities',
		conditionalElem: '#political-sensitivities',
		shouldShow: function( value ){ return ( value === 'true' ); }
	});
};
