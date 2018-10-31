ma.pages.barrier.edit = function(){

	if( !( jessie.queryOne && jessie.attachListener ) ){ return; }

	var heading = jessie.queryOne( '.js-heading-caption' );
	var input = jessie.queryOne( '#title' );

	if( input && heading ){

		jessie.attachListener( input, 'keyup', function(){

			heading.innerText = input.value;
		} );
	}
};
