ma.components.ConditionalRadioContent = (function( jessie ){

	if( !jessie.hasFeatures( 'bind', 'query', 'queryOne', 'addClass', 'setAriaAttribute', 'attachListener', 'getInputValue' ) ){ return; }

	var bind = jessie.bind;
	var query = jessie.query;
	var queryOne = jessie.queryOne;
	var attachListener = jessie.attachListener;
	var addClass = jessie.addClass;
	var setAriaAttribute = jessie.setAriaAttribute;
	var getInputValue = jessie.getInputValue;

	function ConditionalRadioContent( opts){

		this.inputContainer = queryOne( opts.inputContainer );
		this.inputName = opts.inputName;
		this.conditionalElem = queryOne( opts.conditionalElem );
		this.shouldShow = opts.shouldShow;
		this.events = {
			toggle: new ma.CustomEvent()
		};

		if( !this.inputContainer ){ throw new Error( 'inputContainer not found' ); }
		if( !this.inputName ){ throw new Error( 'inputName is required' ); }
		if( !this.conditionalElem ){ throw new Error( 'conditionalElem not found' ); }
		if( !this.shouldShow ){ throw new Error( 'shouldShow is required' ); }

		var inputs = query( '.govuk-radios__input', this.inputContainer );
		var input;
		var i = 0;

		if( !this.conditionalElem || !inputs.length ){ return; }

		this.conditionalElemId = this.conditionalElem.getAttribute( 'id' );
		addClass( this.conditionalElem, 'visually-hidden' );
		setAriaAttribute( this.conditionalElem, 'hidden', true );

		while( ( input = inputs[ i++ ] ) ){

			attachListener( input, 'click', bind( this.checkState, this ) );

			if( this.shouldShow( getInputValue( input ) ) ){
				setAriaAttribute( input, 'controls', this.conditionalElemId );
			}
		}

		this.checkState();
	}

	ConditionalRadioContent.prototype.toggleConditional = function( show ){

		var classFn = ( show ? 'removeClass' : 'addClass' );

		jessie[ classFn ]( this.conditionalElem, 'visually-hidden' );
		setAriaAttribute( this.conditionalElem, 'hidden', !show );

		this.events.toggle.publish( show );
	};

	ConditionalRadioContent.prototype.checkState = function( /* e */ ){

		var checked = queryOne( 'input[ name="' + this.inputName + '" ]:checked', this.inputContainer );

		if( checked ){

			var value = checked && getInputValue( checked );
			var show = this.shouldShow( value );
			this.toggleConditional( show );
		}
	};

	return ConditionalRadioContent;

}( jessie ));
