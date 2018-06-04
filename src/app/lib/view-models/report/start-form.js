const metadata = require( '../../metadata' );

const statusTypes = [];

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

module.exports = ( sessionValues = {} ) => {

	if( !statusTypes.length ){

		for( let [ key, value ] of Object.entries( metadata.getStatusTypes() ) ){

			statusTypes.push( {
				value: key,
				text: value
			} );
		}
	}

	return {

		statusTypes: statusTypes.map( isMatching( sessionValues.status ) ),
		emergencyTypes: emergencyTypes.map( isMatching( sessionValues.emergency ) )
	};
};
