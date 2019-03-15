ma.components.DocumentList = (function( doc ){

	var LIST_CLASS = 'js-documents-list';
	var DATA_KEY = 'document-id';
	var IS_EDIT_KEY = 'is-edit';

	if( !( jessie.hasFeatures(
		'queryOne',
		'bind',
		'attachListener',
		'getEventTarget',
		'cancelDefault',
		'getElementData',
		'setElementData'
	) ) ){ return; }

	function DocumentList( fileUpload ){

		if( !fileUpload ){ throw new Error( 'fileUpload is required' ); }

		this.fileUpload = fileUpload;
		this.list = jessie.queryOne( '.' + LIST_CLASS ) || this.createList();
		this.documents = this.list.parentNode;

		this.events = {
			delete: new ma.CustomEvent()
		};

		jessie.attachListener( this.list, 'click', jessie.bind( this.handleClick, this ) );
	}

	DocumentList.prototype.handleClick = function( e ){

		var target = jessie.getEventTarget( e );
		var documentId = jessie.getElementData( target, DATA_KEY );
		var isEdit = jessie.getElementData( target, IS_EDIT_KEY );

		if( !isEdit && documentId ){

			jessie.cancelDefault( e );
			this.events.delete.publish( documentId );
		}
	};

	DocumentList.prototype.createList = function(){

		var documents = doc.createElement( 'div' );
		var heading = doc.createElement( 'h3' );
		var list = doc.createElement( 'ul' );

		documents.className = 'documents';

		heading.className = 'documents__heading';
		heading.innerText = 'Attached documents';

		list.className = 'documents__list';

		documents.appendChild( heading );
		documents.appendChild( list );

		return list;
	};

	DocumentList.prototype.addItem = function( document ){

		var item = doc.createElement( 'li' );
		var file = doc.createElement( 'span' );
		var deleteLink = doc.createElement( 'a' );
		var input = doc.createElement( 'input' );

		file.class = 'document__list__item__file';
		file.innerHTML = ( '<strong>' + document.name + '</strong> - ' + document.size + ' ' );

		deleteLink.href = '#';
		deleteLink.innerText = 'delete';
		jessie.setElementData( deleteLink, DATA_KEY, document.id );

		input.type = 'hidden';
		input.name = 'documentIds';
		input.value = document.id;

		item.appendChild( file );
		item.appendChild( deleteLink );
		item.appendChild( input );

		this.list.appendChild( item );

		if( !this.documents.parentNode ){

			this.fileUpload.formGroup.parentNode.insertBefore( this.documents, this.fileUpload.formGroup );
		}
	};

	DocumentList.prototype.removeItem = function( uuid ){

		var input = jessie.queryOne( 'input[value="' + uuid + '"]', this.list );
		var item = input && input.parentNode;

		if( item ){

			this.list.removeChild( item );
		}

		if( !this.list.children.length ){

			this.documents.parentNode.removeChild( this.documents );
		}
	};

	return DocumentList;

})( document );
