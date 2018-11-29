ma.pages.barrier.interactions.addNote = (function( doc, jessie ){

	return function(){

		if( !( ma.components.FileUpload && ma.xhr2 && ( typeof FormData !== 'undefined' ) && jessie.hasFeatures( 'queryOne' ) ) ){ return; }

		var documentIdInput;// = jessie.queryOne( '.js-document-id' );
		var fileUpload = new ma.components.FileUpload( {
			group: '.js-form-group',
			input: '.js-file-input',
			limitText: '.js-max-file-size'
		} );

		function setDocumentId( id ){

			if( !documentIdInput ){

				documentIdInput = doc.createElement( 'input' );
				documentIdInput.type = 'hidden';
				documentIdInput.name = 'documentId';
				fileUpload.form.append( documentIdInput );
			}

			documentIdInput.value = id;
		}

		function updateProgress( e ){

			if( e.lengthComputable ){
				fileUpload.setProgress( 'uploading file... ' + Math.floor( ( e.loaded / e.total ) * 100 ) + '%' );
			}
		}

		function transferFailed(){
			fileUpload.setError( 'Failed to upload document' );
			fileUpload.showLink();
		}

		function transferCanceled(){
			fileUpload.setError( 'Failed to upload document' );
			fileUpload.showLink();
		}

		function checkFileStatus( file, url, documentId ){

			var xhr = ma.xhr2();

			xhr.addEventListener( 'error', transferFailed, false );
			xhr.addEventListener( 'abort', transferCanceled, false );
			xhr.addEventListener( 'load', function(){

				var responseCode = xhr.status;
				var data;

				try {

					data = JSON.parse( xhr.response );

				} catch( e ){

					//console.log( e );
				}

				if( responseCode === 200 && data ){

					var passed = data.passed;

					if( !passed ){

						fileUpload.setError( 'File has a virus, please upload a different file' );
						fileUpload.showLink();
						return;
					}

					fileUpload.setFile( file );
					setDocumentId( documentId );

				} else {

					var message = ( data.message || 'There was an unexpected error, try again' );
					fileUpload.setError( message );
					fileUpload.showLink();
				}

			}, false );

			xhr.open( 'GET', url, true );
			xhr.send();
		}

		function loaded( e ){

			var xhr = e.target;
			var responseCode = xhr.status;
			var data;

			try {

				data = JSON.parse( xhr.response );

			} catch( e ){

				data = {};
			}

			if( responseCode === 200 ){

				var documentId = data.documentId;
				var file = data.file;
				var checkUrl = data.checkUrl;

				if( documentId && file && checkUrl ){

					fileUpload.setProgress( 'scanning for viruses...' );
					checkFileStatus( file, checkUrl, documentId );

				} else {

					fileUpload.setError( 'There was an issue uploading the document, try again' );
					fileUpload.showLink();
				}

			} else {

				var message = ( data.message || 'There was an unexpected error, try again' );
				fileUpload.setError( message );
				fileUpload.showLink();
			}
		}

		function newFile( file ){

			var xhr2 = ma.xhr2();
			var formData = new FormData();

			formData.append( 'document', file );

			if( xhr2.upload ){

				xhr2.upload.addEventListener( 'progress', updateProgress, false );
			}

			xhr2.addEventListener( 'error', transferFailed, false );
			xhr2.addEventListener( 'abort', transferCanceled, false );
			xhr2.addEventListener( 'load', loaded, false );

			xhr2.open( 'POST', fileUpload.action, true );
			xhr2.send( formData );

			fileUpload.setProgress( 'uploading file... 0%' );
		}

		fileUpload.events.file.subscribe( newFile );
		fileUpload.events.delete.subscribe( function(){

			if( documentIdInput ){
				documentIdInput.value = '';
			}
		} );
	};

}( document, jessie ));
