const metadata = require( '../metadata' );

module.exports = ( itemKey, metadataKey ) => metadata[ metadataKey ][ itemKey ];
