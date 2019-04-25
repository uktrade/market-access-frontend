ma.pages.report.index = (function(){

	var MODAL_CLASS = 'js-modal';

	return function(){

		if( !jessie.hasFeatures(
			'bind', 'ajaxGet', 'hasClass', 'getEventTarget', 'attachListener', 'cancelDefault', 'queryOne'
		) ){ return; }

		if( !ma.components.Modal ){ return; }

		var modal = new ma.components.Modal();
		var container = jessie.queryOne( '.js-modal-delete' );

		function handleClick( e ){

			var target = jessie.getEventTarget( e );
			var useModal = jessie.hasClass( target, MODAL_CLASS );

			if( !useModal || modal.isOpen ){ return; }

			var url = target.href;

			jessie.cancelDefault( e );

			jessie.ajaxGet( url, {
				success: function( data ){

					try {

						var wrapper = document.createElement( 'div' );
						wrapper.innerHTML = data;
						modal.open( jessie.queryOne( '.modal__content', wrapper ) );
						wrapper = null;

					} catch( e ){

						window.location.href = url;
					}
				},
				fail: function(){
					window.location.href = url;
				}
			} );
		}

		if( container ){

			jessie.attachListener( container, 'click', handleClick );
		}
	};
})();
