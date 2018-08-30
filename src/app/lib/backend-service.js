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

function getDate( field ){

	if( field ){

		const { year, month, day } = field;

		if( year && month && day ){

			return [ year, month, day ].join( '-' );
		}
	}
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

function transformReport( report ){

	sortReportProgress( report );

	if( report.barrier_type ){

		report.barrier_type_id = report.barrier_type.id;
		report.barrier_type_category =report.barrier_type.category;
	}

	return report;
}

function transformSingleReport( { response, body } ){

	if( response.isSuccess ){

		body = transformReport( body );
	}

	return { response, body };
}

function transformReportList( { response, body } ){

	if( response.isSuccess && Array.isArray( body.results ) ){

		body.results = body.results.map( transformReport );
	}

	return { response, body };
}

function updateReport( token, reportId, data ){

	return backend.put( `/reports/${ reportId }`, token, data );
}

module.exports = {

	getMetadata: () => backend.get( '/metadata' ),
	getUser: ( req ) => backend.get( '/whoami', getToken( req ) ),

	barriers: {
		getAll: ( req ) => backend.get( '/barriers', getToken( req ) ),
		get: ( req, barrierId ) => backend.get( `/barriers/${ barrierId }`, getToken( req ) ),
		getInteractions: ( req, barrierId ) => backend.get( `/barriers/${ barrierId }/interactions`, getToken( req ) ),
		saveNote: ( req, barrierId, values ) => backend.post( `/barriers/${ barrierId }/interactions`, getToken( req ), {
			text: values.note,
			pinned: ( values.pinned === 'true' )
		} ),
		resolve: ( req, barrierId, values ) => {

			const { day, month, year } = values.resolvedDate;

			return backend.post( `/barriers/${ barrierId }/resolve`, getToken( req ), {
				status_date: [ year, month, day ].join( '-' ) + 'T00:00',
				summary: values.resolvedSummary
			} );
		},
		hibernate: ( req, barrierId, values ) => backend.post( `/barriers/${ barrierId }/hibernate`, getToken( req ), {
			summary: values.hibernationSummary
		} ),
		open: ( req, barrierId, values ) => backend.post( `/barriers/${ barrierId }/open`, getToken( req ), {
			summary: values.openSummary
		} )
	},

	reports: {
		getAll: ( req ) => backend.get( '/reports', getToken( req ) ).then( transformReportList ),
		getAllUnfinished: ( req ) => backend.get( '/reports/unfinished', getToken( req ) ).then( transformReportList ),
		get: ( req, reportId ) => backend.get( `/reports/${ reportId }`, getToken( req ) ).then( transformSingleReport ),
		save: ( req, values ) => backend.post( '/reports', getToken( req ), {
			problem_status: getValue( values.status ),
			is_emergency: getValue( values.emergency ),
			company_id: getValue( values.company.id ),
			company_name: getValue( values.company.name ),
			company_sector_id: getValue( values.company.sector && values.company.sector.id ),
			company_sector_name: getValue( values.company.sector && values.company.sector.name ),
			contact_id: getValue( values.contactId )
		} ),
		update: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
			problem_status: getValue( values.status ),
			is_emergency: getValue( values.emergency ),
			company_id: getValue( values.company.id ),
			company_name: getValue( values.company.name ),
			company_sector_id: getValue( values.company.sector && values.company.sector.id ),
			company_sector_name: getValue( values.company.sector && values.company.sector.name ),
			contact_id: getValue( values.contactId )
		} ),
		saveProblem: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
			product: getValue( values.item ),
			commodity_codes: getValue( values.commodityCode ),
			export_country: getValue( values.country ),
			problem_description: getValue( values.description ),
			barrier_title: getValue( values.barrierTitle ),
			barrier_awareness: getValue( values.barrierAwareness ),
			barrier_awareness_other: getValue( values.barrierAwarenessOther )
		} ),
		saveImpact: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
			problem_impact: getValue( values.impact ),
			estimated_loss_range: getValue( values.losses ),
			other_companies_affected: getValue( values.otherCompanies ),
			other_companies_info: getValue( values.otherCompaniesInfo )
		} ),
		saveLegal: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
			has_legal_infringement: getValue( values.hasInfringed ),
			wto_infringement: getCheckboxValue( values.infringements, 'wtoInfringement' ),
			fta_infringement: getCheckboxValue( values.infringements, 'ftaInfringement' ),
			other_infringement: getCheckboxValue( values.infringements, 'otherInfringement' ),
			infringement_summary: getValue( values.infringementSummary )
		} ),
		saveBarrierType: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
			barrier_type: getValue( values.barrierType )
		} ),
		saveSupport: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
			is_resolved: getValue( values.resolved ),
			support_type: getValue( values.supportType ),
			steps_taken: getValue( values.stepsTaken ),
			resolved_date: getValue( getDate( values.resolvedDate ) ),
			resolution_summary: getValue( values.resolvedSummary ),
			is_politically_sensitive: getValue( values.politicalSensitivities ),
			political_sensitivity_summary: getValue( values.sensitivitiesDescription )
		} ),
		saveNextSteps: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
			govt_response_requested: getValue( values.response ),
			is_commercially_sensitive: getValue( values.sensitivities ),
			commercial_sensitivity_summary: getValue( values.sensitivitiesText ),
			can_publish: getValue( values.permission )
		} ),
		submit: ( req, reportId ) => backend.put( `/reports/${ reportId }/submit`, getToken( req ) )
	}
};
