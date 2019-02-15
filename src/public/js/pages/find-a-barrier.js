ma.pages.findABarrier = (function( doc, jessie ){

	var filterClass = 'js-filter';
	var filterGroupClass = 'js-filter-group';
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

	function hasCheckboxChanged( input ){

		return input.checked !== input.defaultChecked;
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

				case 'checkbox':
					changed = hasCheckboxChanged( filter );
				break;
			}

			if( changed ){ break; }
		}

		return changed;
	}

	return function(){

		if( !( jessie.query && jessie.queryOne && jessie.attachListener ) ){ return; }

		var singleFilters = jessie.query( '.' + filterClass );
		var groupFilterContainer = jessie.query( '.' + filterGroupClass );
		var groupFilters = jessie.query( '.' + filterGroupClass + ' input' );
		var submit = jessie.queryOne( '.' + submitClass );

		var i = 0;
		var filter;
		var filters = singleFilters.concat( groupFilters );

		function handleChange(){

			submit.disabled = !filtersHaveChanged( filters );
		}

		while( ( filter = singleFilters[ i++ ] ) ){

			jessie.attachListener( filter, 'change', handleChange );
		}

		i = 0;

		while( ( filter = groupFilterContainer[ i++ ] ) ){

			jessie.attachListener( filter, 'change', handleChange );
		}

		if( !filtersHaveChanged( filters ) ){
			submit.disabled = true;
		}

		singleFilters = null;
		groupFilterContainer = null;
		groupFilters = null;
	};
}( document, jessie ));
