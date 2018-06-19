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

module.exports = ( csrfToken, formValues = {}, sessionValues = {} ) => {

	if( !lossScale ){ lossScale = radioItemsFromObj( metadata.lossScale ); }
	if( !boolScale ){ boolScale = radioItemsFromObj( metadata.boolScale ); }

	return {
		csrfToken,
		losses: lossScale.map( isMatching( formValues.losses, sessionValues.losses ) ),
		otherCompanies: boolScale.map( isMatching( formValues.otherCompanies, sessionValues.otherCompanies ) )
	};
};
