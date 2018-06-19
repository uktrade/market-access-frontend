module.exports = ( list, name ) => {

	if( Array.isArray( list ) ){

		let item;
		let i = 0;

		while( ( item = list[ i++ ] ) ){

			if( item.href === '#' + name ){
				return item;
			}
		}
	}
};
