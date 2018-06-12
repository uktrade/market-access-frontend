const backend = require( './backend-request' );

module.exports = {

	getMetadata: () => backend.get( '/metadata/' ),
	getUser: ( req ) => backend.get( '/whoami/', req.session.ssoToken ),
	saveNewReport: ( req, { status, emergency }, company ) => backend.post( '/barriers/', req.session.ssoToken, {
		problem_status: status,
		is_emergency: emergency,
		company_id: company.id,
		company_name: company.name
	} ),
	getBarriers: ( req ) => backend.get( '/barriers/', req.session.ssoToken ).then( ( data ) => {

		//circular ref if we require before this point!
		const metadata = require( './metadata' );

		function updateStatus( types ){

			return ( item ) => {

				item.problem_status = types[ item.problem_status ];
				return item;
			};
		}

		if( data.body && data.body.results && data.body.results.length ){

			data.body.results = data.body.results.map( updateStatus( metadata.getStatusTypes() ) );
		}

		return data;
	} ),
	saveContact: ( req, barrierId, contactId ) => backend.put( `/barriers/${ barrierId }/`, req.session.ssoToken, {
		contact_id: contactId
	} )
};
