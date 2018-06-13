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

	if( !lossScale ){ lossScale = radioItemsFromObj( metadata.lossScale ); }
	if( !boolScale ){ boolScale = radioItemsFromObj( metadata.boolScale ); }

	return {
		csrfToken,
		losses: metadata.lossScale.map( isMatching( sessionValues.status ) ),
		otherCompanies: metadata.boolScale.map( isMatching( sessionValues.emergency ) )
	};
};
