ma.pages.barrier.interactions.addNote = (function( doc, jessie ){

	return function(){

		if( !( ma.xhr2 && ( typeof FormData !== 'undefined' ) && jessie.hasFeatures(
			'attachListener', 'queryOne', 'addClass', 'cancelDefault', 'getElementData', 'setElementData', 'detachListener'
		) ) ){ return; }

		var fileInput = jessie.queryOne( '.js-file-input' );
		var limitText = jessie.queryOne( '.js-max-file-size' );

		if( !fileInput || !limitText ){ return; }

		var form = fileInput.form;
		var action = jessie.getElementData( form, 'xhr-upload' );

		if( !form ){ console.log( 'no form' ); return; }
		if( !action ){ console.log( 'No action on form' ); return; }
		if( !fileInput || !limitText ){ console.log( 'All elements not found' ); return; }

		var documentIdInput;// = jessie.queryOne( '.js-document-id' );
		var link = doc.createElement( 'a' );
		var progress = doc.createElement( 'span' );
		var del = doc.createElement( 'a' );

		link.innerText = 'Attach document';
		link.className = 'file-upload__link';
		link.href = '#';
		limitText.parentNode.insertBefore( link, limitText );

		progress.className = 'file-upload__progress';

		del.innerText = 'delete';
		del.className = 'file-upload__delete';
		del.href = '#';

		fileInput.style.display = 'none';
		jessie.addClass( limitText, 'file-upload__size-limit--js' );

		function selectDocument( e ){

			jessie.cancelDefault( e );
			fileInput.click();
		}

		function deleteDocument( e ){

			jessie.cancelDefault( e );

			progress.style.display = 'none';
			del.style.display = 'none';
			link.style.display = '';
			limitText.style.display = '';

			documentIdInput.value = '';
			fileInput.value = '';

			form.appendChild( fileInput );
			form.focus();
		}

		function hideLink(){

			link.style.display = 'none';
			limitText.style.display = 'none';
		}

		function setProgress( txt ){

			progress.innerText = txt;
			progress.focus();
		}

		function showFile( file ){

			progress.innerHTML = ( '<strong>' + file.name + '</strong> - ' + file.size );

			if( !del.parentNode ){
				progress.parentNode.appendChild( del );
			}

			del.style.display = '';
		}

		function setDocumentId( id ){

			if( !documentIdInput ){

				documentIdInput = doc.createElement( 'input' );
				documentIdInput.type = 'hidden';
				documentIdInput.name = 'documentId';
				form.append( documentIdInput );
			}

			documentIdInput.value = id;
		}

		function updateProgress( e ){

			if( e.lengthComputable ){
				setProgress( 'uploading file... ' + Math.floor( ( e.loaded / e.total ) * 100 ) + '%' );
			}
		}

		function transferFailed( e ){
			console.log( 'failed', e );
		}

		function transferCanceled( e ){
			console.log( 'cancelled', e );
		}

		function checkFileStatus( file, url ){

			var xhr = ma.xhr2();

			xhr.addEventListener( 'load', function(){

				var responseCode = xhr.status;

				if( responseCode === 200 ){

					try {

						var data = JSON.parse( xhr.response );
						var passed = data.passed;

						if( !passed ){

							setProgress( 'File has a virus, please upload a different file' );
							return;
						}

					} catch( e ){

						console.log( e );
					}

					showFile( file );
				}
			}, false );

			xhr.open( 'GET', url, true );
			xhr.send();
		}

		function loaded( e ){

			var xhr = e.target;
			var responseCode = xhr.status;

			if( responseCode === 200 ){

				try {

					var data = JSON.parse( xhr.response );
					var documentId = data.documentId;
					var file = data.file;
					var checkUrl = data.checkUrl;

					setProgress( 'scanning for viruses...' );
					checkFileStatus( file, checkUrl );
					setDocumentId( documentId );

					//remove the file input so the file is not uploaded again when saving the form
					fileInput.parentNode.removeChild( fileInput );

				} catch( e ){

					console.log( e );
				}
			}
		}

		function inputChange(){

			var file = fileInput.files[ 0 ];

			if( !file ){ return; }

			var xhr2 = ma.xhr2();
			var formData = new FormData();

			formData.append( 'document', file );

			if( xhr2.upload ){

				xhr2.upload.addEventListener( 'progress', updateProgress, false );
			}

			xhr2.addEventListener( 'error', transferFailed, false );
			xhr2.addEventListener( 'abort', transferCanceled, false );
			xhr2.addEventListener( 'load', loaded, false );

			xhr2.open( 'POST', action, true );
			xhr2.send( formData );

			setProgress( 'uploading file... 0%' );
			link.parentNode.insertBefore( progress, link );
			hideLink();
			progress.style.display = '';//after one upload this will be hidden
		}

		jessie.attachListener( link, 'click', selectDocument );
		jessie.attachListener( fileInput, 'change', inputChange );
		jessie.attachListener( del, 'click', deleteDocument );
	};

}( document, jessie ));
