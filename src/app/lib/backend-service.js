const backend = require( './backend-request' );

module.exports = {

	getMetadata: () => backend.get( '/metadata/' ),
	getUser: ( req ) => backend.get( '/whoami/', req.session.ssoToken ),
	saveNewReport: ( req, { status, emergency }, companyId ) => backend.post( '/barriers/', req.session.ssoToken, {
			problem_status: status,
			is_emergency: emergency,
			company_id: companyId
		} )
};
