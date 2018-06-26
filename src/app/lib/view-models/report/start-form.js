const metadata = require( '../../metadata' );
const radioItemsFromObj = require( '../../radio-items-from-object' );

let statusTypes;
let emergencyTypes;

function isMatching( ...values ){

	const savedValue = values.find( ( value ) => value != null );

	return ( item ) => {

		// need to use Abstract Equality Comparison
		// as some values are saved as a string but returned as a number
		item.checked = ( savedValue == item.value );

		return item;
	};
}

module.exports = ( csrfToken, report = {}, formValues = {}, sessionValues = {} ) => {

	if( !statusTypes ){ statusTypes = radioItemsFromObj( metadata.statusTypes ); }
	if( !emergencyTypes ){ emergencyTypes = radioItemsFromObj( metadata.bool ); }

	return {
		csrfToken,
		statusTypes: statusTypes.map( isMatching( formValues.status, sessionValues.status, report.problem_status ) ),
		emergencyTypes: emergencyTypes.map( isMatching( formValues.emergency, sessionValues.emergency, ( report.is_emergency + '' ) ) )
	};
};
