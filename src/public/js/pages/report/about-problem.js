ma.pages.report.aboutProblem = function(){

	if( !ma.components.ConditionalRadioContent ){ return; }

	new ma.components.ConditionalRadioContent({
		inputContainer: '.barrier-awareness',
		inputName: 'barrierAwareness',
		conditionalElem: '#conditional-OTHER',
		shouldShow: function( value ){ return ( value === 'OTHER' ); }
	});
};
