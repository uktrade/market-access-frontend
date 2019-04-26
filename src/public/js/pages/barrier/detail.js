ma.pages.barrier.detail = (function( doc, jessie ){

	function setupAttachments( noteErrorText ){

		if( !( ma.components.FileUpload && ma.components.Attachments && ma.components.TextArea && ma.xhr2 && ( typeof FormData !== 'undefined' ) && jessie.hasFeatures(
			'queryOne', 'cancelDefault', 'getElementData'
		) ) ){ return; }

		var fileUpload;
		var attachments;
		var note;

		try {

			fileUpload = new ma.components.FileUpload( {
				group: '.js-form-group',
				input: '.js-file-input',
				limitText: '.js-max-file-size'
			} );

		} catch( e ) { return; }

		try {

			note = new ma.components.TextArea( {
				group: '.js-note-group',
				input: '.js-note-text'
			} );

		} catch( e ){ return; }

		var submit = jessie.queryOne( '.js-submit-button' );
		var form = fileUpload.form;

		if( !submit ){ return; }
		if( !form ){ return; }

		var deleteUrl = jessie.getElementData( form, 'xhr-delete' );

		try {

			attachments = new ma.components.Attachments( fileUpload );

		} catch( e ){ return; }

		function showError( message ){

			submit.disabled = false;
			fileUpload.setError( message );
			fileUpload.showLink();
		}

		function updateProgress( e ){

			if( e.lengthComputable ){

				if( e.loaded === e.total ){

					fileUpload.setProgress( 'scanning file for viruses...' );

				} else {

					fileUpload.setProgress( 'uploading file... ' + Math.floor( ( e.loaded / e.total ) * 100 ) + '%' );
				}
			}
		}

		function transferFailed(){
			showError( 'Upload of document cancelled, try again.' );
		}

		function transferCanceled(){
			showError( 'Upload of document cancelled, try again.' );
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

				if( documentId && file ){

					submit.disabled = false;
					fileUpload.showLink();
					attachments.addItem( {
						id: documentId,
						name: file.name,
						size: file.size
					} );

				} else {

					showError( 'There was an issue uploading the document, try again' );
				}

			} else if( responseCode === 401 ){

				showError( data.message );

			} else {

				var message = ( data.message || 'A system error has occured, so the file has not been uploaded. Try again.' );
				showError( message );
			}
		}

		function newFile( file ){

			var xhr2 = ma.xhr2();
			var formData = new FormData();

			submit.disabled = true;
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

		function handleFormSubmit( e ){

			if( !note.hasValue() ){

				jessie.cancelDefault( e );
				note.setError( noteErrorText );
				note.focus();
			}
		}

		function deleteDocument( documentId ){

			if( !documentId ){ return; }

			var xhr = ma.xhr2();
			var url = deleteUrl.replace( ':uuid', documentId );

			xhr.open( 'POST', url, true );
			xhr.send();

			attachments.removeItem( documentId );
		}

		fileUpload.events.file.subscribe( newFile );
		attachments.events.delete.subscribe( deleteDocument );

		jessie.attachListener( form, 'submit', handleFormSubmit );
	}

	return function( opts ){

		setupAttachments( opts.noteErrorText );

		if( ma.components.BarrierSummary ){
			new ma.components.BarrierSummary( opts.barrierSummary );
		}

		if( ma.components.DeleteModal ){
			new ma.components.DeleteModal();
		}
	};

}( document, jessie ));
