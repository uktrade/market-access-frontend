const backend = require( './backend-request' );

function getToken( req ){

	return req.session.ssoToken;
}

function sortReportProgress( item ){

	if( Array.isArray( item.progress ) ){

		item.progress.sort( ( a, b ) => {

			const aCode = a.stage_code;
			const bCode = b.stage_code;

			if( aCode === bCode ){ return 0; }
			if( Number( aCode ) < Number( bCode ) ){ return -1; }
			if( Number( aCode ) > Number( bCode ) ){ return 1; }

		} );
	}
}

function transformReport( { response, body } ){

	if( response.isSuccess ){

		sortReportProgress( body );
	}

	return { response, body };
}

function transformReports( { response, body } ){

	if( response.isSuccess && Array.isArray( body.results ) ){

		body.results.forEach( sortReportProgress );
	}

	return { response, body };
}

module.exports = {

	getMetadata: () => backend.get( '/metadata/' ),
	getUser: ( req ) => backend.get( '/whoami/', getToken( req ) ),
	getReports: ( req ) => backend.get( '/reports/', getToken( req ) ).then( transformReports ),
	getReport: ( req, reportId ) => backend.get( `/reports/${ reportId }/`, getToken( req ) ).then( transformReport ),
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
