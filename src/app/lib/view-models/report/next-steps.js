const metadata = require( '../../metadata' );
const radioItemsFromObj = require( '../../radio-items-from-object' );

let responses;
let sensitivities;
let permissions;


module.exports = ( csrfToken, report ) => {

	if( !responses ){ responses = radioItemsFromObj( metadata.govResponse ); }
	if( !permissions ){ permissions = radioItemsFromObj( metadata.publishResponse ); }
	if( !sensitivities ){ sensitivities = radioItemsFromObj( metadata.bool ); }

	return {
		csrfToken,
		responses,
		sensitivities,
		permissions
	};
};
