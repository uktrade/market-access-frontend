ma.components.Header = (function(){

	if( !jessie.hasFeatures( 'bind', 'queryOne', 'toggleClass', 'attachListener' ) ){ return; }

	function Header( $module ){
		this.$module = $module;
	}

	Header.prototype.init = function(){
		// Check for module
		var $module = this.$module;
		if( !$module ){ return;	}

		// Check for button
		var $toggleButton = jessie.queryOne( '.js-header-toggle', $module );
		if( !$toggleButton ){ return; }

		var $user = jessie.queryOne( '.header-wrapper__user', $module );
		if( !$user ){ return; }
		this.$user = $user;

		// Handle $toggleButton click events
		jessie.attachListener( $toggleButton, 'click', jessie.bind( this.handleClick, this ) );
	};

	Header.prototype.handleClick = function( event ){

		var $toggleButton = event.target || event.srcElement;
		var $target = jessie.queryOne( ( '#' + $toggleButton.getAttribute( 'aria-controls' ) ), this.$module );

		// If a button with aria-controls, handle click
		if( $toggleButton && $target ){

			var isAriaHidden = ( $target.getAttribute( 'aria-hidden' ) === 'false' );

			jessie.toggleClass( $target, 'govuk-header__navigation--open' );
			jessie.toggleClass( $toggleButton, 'govuk-header__menu-button--open' );
			jessie.toggleClass( this.$user, 'header-wrapper__user--open' );

			$toggleButton.setAttribute( 'aria-expanded', $toggleButton.getAttribute( 'aria-expanded' ) !== 'true' );
			$target.setAttribute( 'aria-hidden', isAriaHidden );
			this.$user.setAttribute( 'aria-hidden', isAriaHidden );
		}
	};

	return Header;
}());
