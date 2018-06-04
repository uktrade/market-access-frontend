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

module.exports = () => {

	if( !statusTypes.length ){

		for( let [ key, value ] of Object.entries( metadata.getStatusTypes() ) ){

			statusTypes.push( {
				value: key,
				text: value
			} );
		}
	}

	return {

		statusTypes,
		emergencyTypes
	};
};
