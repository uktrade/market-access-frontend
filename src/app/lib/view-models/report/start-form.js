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

function isMatching( sessionValue ){

	return ( item ) => {

		item.checked = ( sessionValue == item.value );

		return item;
	};
}

module.exports = ( csrfToken, sessionValues = {} ) => {

	if( !statusTypes ){

		statusTypes = radioItemsFromObj( metadata.statusTypes );
	}

	return {
		csrfToken,
		statusTypes: statusTypes.map( isMatching( sessionValues.status ) ),
		emergencyTypes: emergencyTypes.map( isMatching( sessionValues.emergency ) )
	};
};
