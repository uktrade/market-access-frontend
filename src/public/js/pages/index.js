ma.pages.index = (function(){

	return function(){

		if( ma.components.Collapsible ){

			ma.components.Collapsible.initAll();
		}

		if( jessie.queryOne && ma.components.ToggleBox ){

			new ma.components.ToggleBox( jessie.queryOne( '.toggle-box' ), {
				more: 'Show list filters',
				less: 'Hide list filters'
			} );
		}
	};
})();
