ma.pages.barrier.interactions.addNote = (function( doc, jessie ){

	return function(){

		return;

		if( !( ma.xhr2 && ( typeof FormData !== 'undefined' ) && jessie.hasFeatures( 'attachListener', 'queryOne', 'addClass', 'cancelDefault' ) ) ){ return; }

		var input = jessie.queryOne( '.js-file-input' );
		var limitText = jessie.queryOne( '.js-max-file-size' );
		var xhr2 = ma.xhr2();

		if( !input || !limitText ){ console.log( 'all elements not found' ); return; }

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

		function inputChange( e ){

			var form = input.form;
			var formData = new FormData();

			formData.append( 'document', input.files[ 0 ] );
		}

		function updateProgress( e ){

		}

		function transferComplete( e ){

		}

		function transferFailed( e ){

		}

		function transferCanceled( e ){

		}

		jessie.attachListener( link, 'click', selectDocument );
		jessie.attachListener( input, 'change', inputChange );
		xhr2.addEventListener( 'progress', updateProgress );
		xhr2.addEventListener( 'load', transferComplete );
		xhr2.addEventListener( 'error', transferFailed );
		xhr2.addEventListener( 'abort', transferCanceled );
	};

}( document, jessie ));
