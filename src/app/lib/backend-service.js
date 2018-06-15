const backend = require( './backend-request' );

function getToken( req ){

	return req.session.ssoToken;
}

module.exports = {

	getMetadata: () => backend.get( '/metadata/' ),
	getUser: ( req ) => backend.get( '/whoami/', getToken( req ) ),
	getBarriers: ( req ) => backend.get( '/barriers/', getToken( req ) ),
	getBarrier: ( req, barrierId ) => backend.get( `/barriers/${ barrierId }/`, getToken( req ) ),
	saveNewBarrier: ( req, { status, emergency }, company, contactId ) => backend.post( '/barriers/', getToken( req ), {
		problem_status: status,
		is_emergency: emergency,
		company_id: company.id,
		company_name: company.name,
		contact_id: contactId
	} ),
	updateBarrier: ( req, barrierId, { status, emergency }, company, contactId ) => backend.put( `/barriers/${ barrierId }/`, getToken( req ), {
		problem_status: status,
		is_emergency: emergency,
		company_id: company.id,
		company_name: company.name,
		contact_id: contactId
	} )
};
