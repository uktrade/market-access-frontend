const metadata = require( '../lib/metadata' );

module.exports = ( req, res ) => res.render( 'what-is-a-barrier', {
	barrierTypes: {
		goods: metadata.barrierTypes.filter( ( type ) => type.category === 'GOODS' ),
		services: metadata.barrierTypes.filter( ( type ) => type.category === 'SERVICES' ),
		goodsAndServices: metadata.barrierTypes.filter( ( type ) => type.category === 'GOODSANDSERVICES' )
	}
} );
