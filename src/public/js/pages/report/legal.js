ma.pages.report.legal = function(){

	if( !ma.components.ConditionalRadioContent ){ return; }

	new ma.components.ConditionalRadioContent({
		inputContainer: '.has-infringed',
		inputName: 'hasInfringed',
		conditionalElem: '#conditional-1',
		shouldShow: function( value ){ return ( value === '1' ); }
	});
};
