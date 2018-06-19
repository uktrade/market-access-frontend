(function( doc, jessie ){

	if( !jessie.hasFeatures( 'query', 'queryOne', 'addClass', 'setAriaAttribute', 'attachListener' ) ){ return; }

	var extraElem = jessie.queryOne( '.report-barrier-emergency' );
	var extraInputs = jessie.query( '.govuk-radios__input', extraElem );
	var inputs = jessie.query( '.problem-status .govuk-radios__input' );
	var input;
	var i = 0;
	var extraElemId;

	if( !extraElem || inputs.length < 2 ){ return; }

	function toggleEmergency( show ){

		var classFn = ( show ? 'removeClass' : 'addClass' );
		var input;
		var i = 0;

		jessie[ classFn ]( extraElem, 'visually-hidden' );
		jessie.setAriaAttribute( extraElem, 'hidden', !show );

		if( !show ){
			// if we hide the extra inputs, make sure none of them are checked
			while( ( input = extraInputs[ i++ ] ) ){
				input.checked = false;
			}
		}
	}

	function controlsEmergency( value ){

		return ( value === '1' || value === '2' );
	}

	function checkState( /* e */ ){

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

		jessie.attachListener( input, 'click', checkState );

		if( controlsEmergency( jessie.getInputValue( input ) ) ){
			jessie.setAriaAttribute( input, 'controls', extraElemId );
		}
	}

	checkState();

}( document, jessie ));
