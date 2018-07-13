ma.pages.report.impact = function(){

	if( !ma.components.ConditionalRadioContent ){ return; }

	new ma.components.ConditionalRadioContent({
		inputContainer: '.other-companies',
		inputName: 'otherCompanies',
		conditionalElem: '#conditional-1',
		shouldShow: function( value ){ return ( value === '1' ); }
	});
};
