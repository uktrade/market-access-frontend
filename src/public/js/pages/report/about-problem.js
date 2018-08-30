ma.pages.report.aboutProblem = function(){

	if( !ma.components.ConditionalRadioContent ){ return; }

	new ma.components.ConditionalRadioContent({
		inputContainer: '.barrier-awareness',
		inputName: 'barrierAwareness',
		conditionalElem: '#conditional-4',
		shouldShow: function( value ){ return ( value === '4' ); }
	});
};
