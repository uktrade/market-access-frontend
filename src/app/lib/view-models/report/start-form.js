const metadata = require( '../../metadata' );
const radioItemsFromObj = require( '../../radio-items-from-object' );

let statusTypes;

const emergencyTypes = [
	{
		'value': 'yes',
		'text': "Yes"
	},
	{
		'value': 'no',
		'text': "No"
	}
];

function isMatching( ...values ){

	return ( item ) => {

		item.checked = ( values.includes( item.value ) );

		return item;
	};
}

module.exports = ( csrfToken, formValues = {}, sessionValues = {} ) => {

	if( !statusTypes ){

		statusTypes = radioItemsFromObj( metadata.statusTypes );
	}

	return {
		csrfToken,
		statusTypes: statusTypes.map( isMatching( formValues.status, sessionValues.status,  ) ),
		emergencyTypes: emergencyTypes.map( isMatching( formValues.emergency, sessionValues.emergency ) )
	};
};
