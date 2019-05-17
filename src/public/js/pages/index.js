ma.pages.index = (function(){

	return function(){

		if( ma.components.Collapsible ){

			ma.components.Collapsible.initAll();
		}

		if( ma.components.ToggleBox ){

			ma.components.ToggleBox.init();
		}
	};
})();
