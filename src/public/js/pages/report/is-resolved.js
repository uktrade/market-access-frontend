ma.pages.report.isResolved = function(){

	if( !ma.components.ConditionalRadioContent ){ return; }

	new ma.components.ConditionalRadioContent({
		inputContainer: '.is-resolved',
		inputName: 'isResolved',
		conditionalElem: '#conditional-true',
		shouldShow: function( value ){ return ( value === 'true' ); }
	});
};
