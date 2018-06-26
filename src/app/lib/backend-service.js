const backend = require( './backend-request' );

function getToken( req ){

	return req.session.ssoToken;
}

module.exports = {

	getMetadata: () => backend.get( '/metadata/' ),
	getUser: ( req ) => backend.get( '/whoami/', getToken( req ) ),
	getReports: ( req ) => backend.get( '/reports/', getToken( req ) ),
	getReport: ( req, reportId ) => backend.get( `/reports/${ reportId }/`, getToken( req ) ),
	saveNewReport: ( req, { status, emergency }, company, contactId ) => backend.post( '/reports/', getToken( req ), {
		problem_status: status,
		is_emergency: emergency,
		company_id: company.id,
		company_name: company.name,
		contact_id: contactId
	} ),
	updateReport: ( req, reportId, { status, emergency }, company, contactId ) => backend.put( `/reports/${ reportId }/`, getToken( req ), {
		problem_status: status,
		is_emergency: emergency,
		company_id: company.id,
		company_name: company.name,
		contact_id: contactId
	} ),
	saveProblem: ( req, reportId, problem ) => backend.put( `/reports/${ reportId }/`, getToken( req ), {
		product: problem.item,
		commodity_codes: problem.commodityCode.split( ', ' ),
		export_country: problem.country,
		problem_description: problem.description,
		problem_impact: problem.impact,
		estimated_loss_range: problem.losses,
		other_companies_affected: problem.otherCompanies
	} )
};
