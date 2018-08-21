ma.pages.barrier.status = function(){

	if( !ma.components.ConditionalRadioContent ){ return; }

	new ma.components.ConditionalRadioContent({
		inputContainer: '.status',
		inputName: 'status',
		conditionalElem: '#conditional-resolve',
		shouldShow: function( value ){ return ( value === 'resolve' ); }
	});

	new ma.components.ConditionalRadioContent({
		inputContainer: '.status',
		inputName: 'status',
		conditionalElem: '#conditional-hibernate',
		shouldShow: function( value ){ return ( value === 'hibernate' ); }
	});

	new ma.components.ConditionalRadioContent({
		inputContainer: '.status',
		inputName: 'status',
		conditionalElem: '#conditional-open',
		shouldShow: function( value ){ return ( value === 'open' ); }
	});
};
