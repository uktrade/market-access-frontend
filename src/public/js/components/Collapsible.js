ma.components.Collapsible = (function(){

	if( !jessie.hasFeatures( 'bind', 'queryOne', 'toggleClass', 'attachListener' ) ){ return; }

	function Collapsible( $module ){
		this.$module = $module;
	}

	Collapsible.prototype.init = function(){
		// Check for module
		var $module = this.$module;
		if( !$module ){ return;	}

		// Check for button
		var $toggleButton = jessie.queryOne( '.collapsible-widget__label', $module );
		if( !$toggleButton ){ return; }

		// Handle $toggleButton click events
		jessie.attachListener( $toggleButton, 'click', jessie.bind( this.handleClick, this ) );
	};

	Collapsible.prototype.handleClick = function( event ){

		var $toggleButton = event.target || event.srcElement;
		var $target = jessie.queryOne( ( '#' + $toggleButton.getAttribute( 'aria-controls' ) ), this.$module );

		// If a button with aria-controls, handle click
		if( $toggleButton && $target ){

			var isAriaHidden = ( $target.getAttribute( 'aria-hidden' ) === 'false' );

			jessie.toggleClass( $toggleButton, 'opened' );

			$toggleButton.setAttribute( 'aria-expanded', $toggleButton.getAttribute( 'aria-expanded' ) !== 'true' );
			$target.setAttribute( 'aria-hidden', isAriaHidden );
			this.$user.setAttribute( 'aria-hidden', isAriaHidden );
		}
	};

	return Collapsible;
}());
