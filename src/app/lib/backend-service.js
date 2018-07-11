const backend = require( './backend-request' );

function getToken( req ){

	return req.session.ssoToken;
}

function getValue( value ){

	return value || null;
}

function getCheckboxValue( parent, field ){

	return getValue( parent ) && !!parent[ field ];
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

function updateReport( token, reportId, data ){

	return backend.put( `/reports/${ reportId }/`, token, data );
}

module.exports = {

	getMetadata: () => backend.get( '/metadata/' ),
	getUser: ( req ) => backend.get( '/whoami/', getToken( req ) ),
	getReports: ( req ) => backend.get( '/reports/', getToken( req ) ).then( transformReports ),
	getReport: ( req, reportId ) => backend.get( `/reports/${ reportId }/`, getToken( req ) ).then( transformReport ),
	saveNewReport: ( req, values ) => backend.post( '/reports/', getToken( req ), {
		problem_status: getValue( values.status ),
		is_emergency: getValue( values.emergency ),
		company_id: getValue( values.company.id ),
		company_name: getValue( values.company.name ),
		contact_id: getValue( values.contactId )
	} ),
	updateReport: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
		problem_status: getValue( values.status ),
		is_emergency: getValue( values.emergency ),
		company_id: getValue( values.company.id ),
		company_name: getValue( values.company.name ),
		contact_id: getValue( values.contactId )
	} ),
	saveProblem: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
		product: getValue( values.item ),
		commodity_codes: getValue( values.commodityCode ),
		export_country: getValue( values.country ),
		problem_description: getValue( values.description ),
		barrier_title: getValue( values.barrierTitle )
	} ),
	saveImpact: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
		problem_impact: getValue( values.impact ),
		estimated_loss_range: getValue( values.losses ),
		other_companies_affected: getValue( values.otherCompanies ),
		other_companies_info: getValue( values.otherCompaniesInfo )
	} ),
	saveLegal: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
		has_legal_infringment: getValue( values.hasInfringed ),
		wto_infingment: getCheckboxValue( values.infringments, 'wtoInfringment' ),
		fta_infingment: getCheckboxValue( values.infringments, 'ftaInfringment' ),
		other_infingment: getCheckboxValue( values.infringments, 'otherInfringment' ),
		infringment_summary: getValue( values.infringmentSummary )
	} ),
	saveBarrierType: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
		barrier_type: getValue( values.barrierType )
	} ),
	saveSupport: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
		is_resolved: getValue( values.resolved ),
		support_type: getValue( values.supportType ),
		steps_taken: getValue( values.stepsTaken ),
		is_politically_sensitive: getValue( values.politicalSensitivities ),
		political_sensitivity_summary: getValue( values.sensitivitiesDescription )
	} ),
	saveNextSteps: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
		govt_response_requester: getValue( values.response ),
		is_commercially_sensitive: getValue( values.sensitivities ),
		commercial_sensitivity_summary: getValue( values.sensitivitiesText ),
		can_publish: getValue( values.permission )
	} ),
	submitReport: ( req, reportId ) => backend.put( `/reports/${ reportId }/submit/`, getToken( req ) )
};
