ma.pages.findABarrier = (function( doc, jessie ){

	var filterClass = 'js-filter';
	var submitClass = 'js-filter-submit';

	function hasSelectChanged( select ){

		var changed = false;
		var def = 0;
		var i = 0;
		var l = select.options.length;
		var opt;

		for( ; i < l; i++ ){
			opt = select.options[ i ];
			changed = changed || ( opt.selected != opt.defaultSelected );
			if( opt.defaultSelected ){ def = i; }
		}

		if( changed && !select.multiple ){
			changed = ( def != select.selectedIndex );
		}

		return changed;
	}

	function filtersHaveChanged( filters ){

		var i = 0;
		var filter;
		var changed = false;

		while( ( filter = filters[ i++ ] ) ){

			switch( filter.type ){

				case 'select-one':
					changed = hasSelectChanged( filter );
				break;
			}

			if( changed ){ break; }
		}

		return changed;
	}

	return function(){

		if( !( jessie.query && jessie.queryOne && jessie.attachListener ) ){ return; }

		var filters = jessie.query( '.' + filterClass );
		var submit = jessie.queryOne( '.' + submitClass );

		var i = 0;
		var filter;

		function handleChange(){

			if( filtersHaveChanged( filters ) ){
				submit.disabled = false;
			}
		}

		while( ( filter = filters[ i++ ] ) ){

			jessie.attachListener( filter, 'change', handleChange );
		}

		if( !filtersHaveChanged( filters ) ){
			submit.disabled = true;
		}
	};
}( document, jessie ));
