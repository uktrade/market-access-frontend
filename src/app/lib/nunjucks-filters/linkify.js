const Autolinker = require( 'autolinker' );

const autolinker = new Autolinker({
	stripPrefix: {
		scheme: true,
		www: false,
	}
});

module.exports = ( text ) => autolinker.link( text );
