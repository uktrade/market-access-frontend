const metadata = require( '../../metadata' );
const radioItemsFromObj = require( '../../radio-items-from-object' );

let lossScale;
let boolScale;

function isMatching( sessionValue ){

	return ( item ) => {

		item.checked = ( sessionValue == item.value );

		return item;
	};
}

module.exports = ( csrfToken, sessionValues = {} ) => {

	if( !lossScale ){ lossScale = radioItemsFromObj( metadata.getLossScale() ); }
	if( !boolScale ){ boolScale = radioItemsFromObj( metadata.getBoolScale() ); }

	return {
		csrfToken,
		losses: lossScale.map( isMatching( sessionValues.status ) ),
		otherCompanies: boolScale.map( isMatching( sessionValues.emergency ) )
	};
};
