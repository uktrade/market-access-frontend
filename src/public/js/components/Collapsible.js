ma.components.Collapsible = (function(){

	if( !jessie.hasFeatures( 'bind', 'queryOne', 'query', 'toggleClass', 'attachListener' ) ){ return; }

	function Collapsible(  ){
		var labels = jessie.query( '.collapsible-widget__label' );

		if( !labels ){ return; }

		for (var i = 0; i < labels.length; i++) {
			jessie.attachListener( labels[i], 'click', jessie.bind( this.handleClick ) );
		}
	}

	Collapsible.prototype.handleClick = function( event ){
		var $toggleButton = event.target || event.srcElement;
		if( $toggleButton ){
			jessie.toggleClass( $toggleButton, 'opened' );
		}
	};

	return Collapsible;
}());
