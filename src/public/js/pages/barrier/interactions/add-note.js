ma.pages.barrier.interactions.addNote = (function( doc, jessie ){

	return function(){

		return;

		if( !( ma.xhr2 && ( typeof FormData !== 'undefined' ) && jessie.hasFeatures( 'attachListener', 'queryOne', 'addClass', 'cancelDefault' ) ) ){ return; }

		var input = jessie.queryOne( '.js-file-input' );
		var limitText = jessie.queryOne( '.js-max-file-size' );
		var form = input.form;

		if( !form.action ){ console.log( 'No action on form' ); return; }
		if( !input || !limitText ){ console.log( 'All elements not found' ); return; }

		console.dir( 'Add note running' );

		var link = doc.createElement( 'a' );
		link.innerText = 'Attach document';
		link.className = 'js-attach-file';
		link.href = '#';

		input.style.display = 'none';

		jessie.addClass( limitText, 'file-upload__size-limit--js' );
		limitText.parentNode.insertBefore( link, limitText );

		function selectDocument( e ){

			jessie.cancelDefault( e );
			input.click();
		}

		function updateProgress( e ){
			console.log( 'progress', e );
		}

		function transferComplete( e ){
			console.log( 'complete' );
		}

		function transferFailed( e ){
			console.log( 'failed' );
		}

		function transferCanceled( e ){
			console.log( 'cancelled' );
		}

		function inputChange( e ){

			var xhr2 = ma.xhr2();
			var formData = new FormData();

			formData.append( 'document', input.files[ 0 ] );

			xhr2.addEventListener( 'progress', updateProgress );
			xhr2.addEventListener( 'load', transferComplete );
			xhr2.addEventListener( 'error', transferFailed );
			xhr2.addEventListener( 'abort', transferCanceled );

			xhr2.open( 'POST', form.action, true );
			xhr2.send( formData );
		}

		jessie.attachListener( link, 'click', selectDocument );
		jessie.attachListener( input, 'change', inputChange );
	};

}( document, jessie ));
