const backend = require( './backend-request' );

function getToken( req ){

	return req.session.ssoToken;
}

function getValue( value ){

	return value || null;
}

/*
function getCheckboxValue( parent, field ){

	return getValue( parent ) && !!parent[ field ];
}
*/

function getDate( field, defaultDay ){

	if( field ){

		const { year, month, day } = field;

		if( year && month ){

			return [ year, month, ( day || defaultDay ) ].join( '-' );
		}
	}
}

function getDefaultedDate( field ){

	return getDate( field, '01' );
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

			return backend.put( `/barriers/${ barrierId }/resolve`, getToken( req ), {
				status_date: [ year, month, day ].join( '-' ) + 'T00:00',
				summary: values.resolvedSummary
			} );
		},
		hibernate: ( req, barrierId, values ) => backend.put( `/barriers/${ barrierId }/hibernate`, getToken( req ), {
			summary: values.hibernationSummary
		} ),
		open: ( req, barrierId, values ) => backend.put( `/barriers/${ barrierId }/open`, getToken( req ), {
			summary: values.openSummary
		} )
	},

	reports: {
		getAll: ( req ) => backend.get( '/reports', getToken( req ) ).then( transformReportList ),
		get: ( req, reportId ) => backend.get( `/reports/${ reportId }`, getToken( req ) ).then( transformSingleReport ),
		save: ( req, values ) => backend.post( '/reports', getToken( req ), {
			problem_status: getValue( values.status ),
			is_resolved: getValue( values.isResolved ),
			resolved_date: getValue( getDefaultedDate( values.resolvedDate ) ),
			export_country: getValue( values.country )
		} ),
		update: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
			problem_status: getValue( values.status ),
			is_resolved: getValue( values.isResolved ),
			resolved_date: getValue( getDefaultedDate( values.resolvedDate ) ),
			export_country: getValue( values.country )
		} ),
		saveHasSectors: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
			sectors_affected: getValue( values.hasSectors )
		} ),
		saveSectors: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
			sectors: getValue( values.sectors )
		} ),
		saveProblem: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
			product: getValue( values.item ),
			problem_description: getValue( values.description ),
			barrier_title: getValue( values.barrierTitle ),
			source: getValue( values.barrierAwareness ),
			other_source: getValue( values.barrierAwarenessOther )
		} ),
		saveBarrierType: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
			barrier_type: getValue( values.barrierType )
		} ),
		submit: ( req, reportId ) => backend.put( `/reports/${ reportId }/submit`, getToken( req ) )
	}
};
