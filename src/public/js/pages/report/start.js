(function( doc, jessie ){

	if( !jessie.hasFeatures( 'query', 'queryOne', 'addClass', 'setAriaAttribute', 'attachListener' ) ){ return; }

	var extraElem = jessie.queryOne( '.report-barrier-emergency' );
	var inputs = jessie.query( '.problem-status .govuk-radios__input' );
	var input;
	var i = 0;
	var extraElemId;

	if( !extraElem || inputs.length < 2 ){ return; }

	function toggleEmergency( show ){

		var classFn = ( show ? 'removeClass' : 'addClass' );
		jessie[ classFn ]( extraElem, 'visually-hidden' );
		jessie.setAriaAttribute( extraElem, 'hidden', !show );
	}

	function controlsEmergency( value ){

		return ( value === '1' || value === '2' );
	}

	function handleClick( /* e */ ){

		var checked = jessie.queryOne( '.problem-status input[ name="status" ]:checked' );

		if( checked ){

			var value = checked && jessie.getInputValue( checked );
			var showEmergency = controlsEmergency( value );
			toggleEmergency( showEmergency );
		}
	}

	extraElemId = extraElem.getAttribute( 'id' );
	jessie.addClass( extraElem, 'visually-hidden' );
	jessie.setAriaAttribute( extraElem, 'hidden', true );

	while( ( input = inputs[ i++ ] ) ){

		jessie.attachListener( input, 'click', handleClick );	

		if( controlsEmergency( jessie.getInputValue( input ) ) ){
			jessie.setAriaAttribute( input, 'controls', extraElemId );
		}
	}

}( document, jessie ));
