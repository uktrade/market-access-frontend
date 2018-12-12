ma.components.BarrierSummary = (function( doc, jessie ){

	var LINK_CLASS = 'barrier-summary-link-toggle';
	var LIST_CLASS = 'barrier-summary-link-list';
	var LIST_ITEM_CLASS = 'barrier-summary-link-list__item';

	if( !jessie.hasFeatures( 'query', 'attachListener', 'bind', 'cancelDefault' ) ){ return; }

	function BarrierSummary( opts ){

		if( !opts.text ){ throw new Error( 'BarierSummary needs text' ); }
		if( !opts.linkClass ){ throw new Error( 'BarrierSummary needs linkClass' ); }

		this.text = opts.text;
		this.links = jessie.query( opts.linkClass );

		if( !this.links.length ){ throw new Error( 'BarrierSummary found no links' ); }

		this.setupList();
		this.setupLink();
	}

	BarrierSummary.prototype.setupList = function(){
		
		var listItem;
		var link;
		var i = 0;
		var firstLink = this.links[ 0 ];

		this.list = doc.createElement( 'ul' );
		this.list.className = LIST_CLASS;
		this.list.style.display = 'none';
		
		firstLink.parentNode.insertBefore( this.list, firstLink );

		while( ( link = this.links[ i++ ] ) ){

			listItem = doc.createElement( 'li' );
			listItem.className = LIST_ITEM_CLASS;
			listItem.appendChild( link );
			this.list.appendChild( listItem );
		}
	};
	
	BarrierSummary.prototype.setupLink = function(){
		
		var toggle = doc.createElement( 'a' );
		
		toggle.href = '#';
		toggle.className = LINK_CLASS;
		toggle.innerText = this.text;
		jessie.attachListener( toggle, 'click', jessie.bind( this.handleClick, this ) );

		this.list.parentNode.insertBefore( toggle, this.list );
		this.toggle = toggle;
	};

	BarrierSummary.prototype.handleClick = function( e ){

		jessie.cancelDefault( e );
	
		var show = this.list.style.display === 'none';
		this.list.style.display = ( show ? '' : 'none' );

		if( !show ){
			this.toggle.blur();
		}
	};

	return BarrierSummary;

})( document, jessie );
