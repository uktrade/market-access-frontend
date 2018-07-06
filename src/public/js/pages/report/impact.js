ma.pages.report.impact = function(){

	if( !ma.components.ConditionalRadioContent ){ return; }

	new ma.components.ConditionalRadioContent({
		inputContainer: '.other-companies',
		inputName: 'otherCompanies',
		conditionalElem: '.conditional-content',
		shouldShow: function( value ){ return ( value === '1' ); }
	});
};
