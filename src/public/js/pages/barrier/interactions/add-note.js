ma.pages.barrier.interactions.addNote = (function( doc, jessie ){

	return function(){

		if( !( ma.xhr2 && jessie.hasFeatures( [ 'attachListener' ] ) ) ){ return; }

		var fileInput = 'document';
		var input = doc.getElementById( fileInput );
		var xhr2 = ma.xhr2();

		function inputChange( e ){

			console.log( e );
		}

		function updateProgress( e ){

		}

		function transferComplete( e ){

		}

		function transferFailed( e ){

		}

		function transferCanceled( e ){

		}

		jessie.attachListener( input, 'change', inputChange );
		xhr2.addEventListener( 'progress', updateProgress );
		xhr2.addEventListener( 'load', transferComplete );
		xhr2.addEventListener( 'error', transferFailed );
		xhr2.addEventListener( 'abort', transferCanceled );
	};

}( document, jessie ));
