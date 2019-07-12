ma.pages.watchList = function(){

	if( !ma.components.ConditionalRadioContent ){ return; }

	new ma.components.ConditionalRadioContent({
		inputContainer: '.replace-or-new',
		inputName: 'replaceOrNew',
		conditionalElem: '#conditional-replace',
		shouldShow: function( value ){ return ( value === 'replace' ); }
	});
};
