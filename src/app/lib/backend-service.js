const backend = require( './backend-request' );
const metadata = require( './metadata' );
const config = require( '../config' );

const SCAN_CHECK_INTERVAL = config.files.scan.statusCheckInterval;
const SCAN_MAX_ATTEMPTS = Math.round( config.files.scan.maxWaitTime / SCAN_CHECK_INTERVAL );
const LOCATION = 'location';
const { RESOLVED, PART_RESOLVED } = metadata.barrier.status.types;
const RESULTS_LIMIT = config.backend.resultsLimit;

function getToken( req ){

	return req.session.ssoToken;
}

function getValue( value ){

	const isBoolean = ( typeof value === 'boolean' );

	return isBoolean ? value : ( value || null );
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

function updateBarrier( token, barrierId, data ){

	return backend.put( `/barriers/${ barrierId }`, token, data );
}

function transformUser( { response, body } ){

	if( response.isSuccess ){

		body.country = metadata.getCountry( body.location );

		if( config.sso.bypass ){

			body.permitted_applications = [
				{
					'key': 'datahub-crm',
				},
				{
					'key': 'market-access',
				}
			];
		}
	}

	body.country = body.country || {};

	return { response, body };
}

function transformSsoUser( { response, body } ){

	if( response.isSuccess ){

		body = {
			...body,
			user_id: body.profile.sso_user_id,
		};
	}

	return { response, body };
}

function getFilterParams( filters ){

	const filterMap = {
		'country': LOCATION,
		'sector': 'sector',
		'type': 'barrier_type',
		'status': 'status',
		'priority': 'priority',
		'region': LOCATION,
		'search': 'text',
		'createdBy': 'createdBy',
	};

	const params = [];
	const locations = [];

	for( let [ filterKey, paramKey ] of Object.entries( filterMap ) ){

		const value = filters[ filterKey ];

		if( value ){

			switch( paramKey ){

				case LOCATION:

					locations.push( value );
					break;

				case 'createdBy':

					if( value.includes( '2' ) ){

						params.push( 'team=1' );

					} else if( value.includes( '1' ) ){

						params.push( 'user=1' );
					}
					break;

				default:

					params.push( `${ paramKey }=${ encodeURIComponent( value ) }` );
			}
		}
	}

	if( locations.length ){

		params.push( `${ LOCATION }=${ locations }` );
	}

	return params;
}

function getBarrierParams( filters = {}, orderBy = 'reported_on', orderDirection ){

	const params = getFilterParams( filters );

	params.push( `ordering=${ orderDirection === 'asc' ? '' :  '-' }${ orderBy }` );

	return params;
}

function addPagination( params, page ){

	params.push( `limit=${ RESULTS_LIMIT }` );
	params.push( `offset=${ RESULTS_LIMIT * ( page - 1 ) }` );

	return params;
}

function getInitialReportValues( formValues ){

	const isFullyResolved = ( formValues.isResolved == RESOLVED );
	const isPartResolved = ( formValues.isResolved == PART_RESOLVED );
	const isResolved = ( isFullyResolved || isPartResolved );
	let date = null;

	if( isFullyResolved ){

		date = formValues.resolvedDate;

	} else if( isPartResolved ){

		date = {
			month: formValues.partResolvedDate.partMonth,
			year: formValues.partResolvedDate.partYear
		};
	}

	return {
		problem_status: getValue( formValues.status ),
		is_resolved: isResolved,
		resolved_status: ( isResolved ? formValues.isResolved : null ),
		resolved_date: getValue( getDefaultedDate( date ) ),
		export_country: getValue( formValues.country ),
		country_admin_areas: getValue( formValues.adminAreas ),
	};
}

const reports = {
	saveSummary: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
		problem_description: getValue( values.description ),
		status_summary: getValue( values.resolvedDescription ),
		next_steps_summary: getValue( values.nextSteps ),
	} ),
	submit: ( req, reportId ) => backend.put( `/reports/${ reportId }/submit`, getToken( req ) ),
};

module.exports = {

	getUser: ( req ) => backend.get( '/whoami', getToken( req ) ).then( transformUser ),
	ping: () => backend.get( '/ping.xml' ),
	getCounts: ( req ) => backend.get( '/counts', getToken( req ) ),
	getSsoUser: ( req, userId ) => backend.get( `/users/${ userId }`, getToken( req ) ).then( transformSsoUser ),

	documents: {
		create: ( req, fileName, fileSize ) => backend.post( '/documents', getToken( req ), {
			original_filename: fileName,
			size: fileSize
		} ),
		delete: ( req, documentId ) => backend.delete( `/documents/${ documentId }`, getToken( req ) ),
		uploadComplete: ( req, documentId ) => backend.post( `/documents/${ documentId }/upload-callback`, getToken( req ) ),
		download: ( req, documentId ) => backend.get( `/documents/${ documentId }/download`, getToken( req ) ),
		getScanStatus: ( req, documentId ) => new Promise( ( resolve, reject ) => {

			const url = `/documents/${ documentId }/upload-callback`;
			const token = getToken( req );
			let attempts = 0;
			const interval = setInterval( async () => {

				attempts++;

				if( attempts > SCAN_MAX_ATTEMPTS ){

					clearInterval( interval );
					return reject( new Error( 'Virus scan took too long' ) );
				}

				try {

					const { response, body } = await backend.post( url, token );

					if( response.isSuccess ){

						const { status } = body;
						const passed = ( status === 'virus_scanned' );

						if( passed || status === 'virus_scanning_failed' ){

							clearInterval( interval );
							resolve( { status, passed } );
						}

					} else {

						reject( new Error( 'Not a successful response from the backend, got ' + response.statusCode ) );
					}

				} catch( e ){

					clearInterval( interval );
					reject( e );
				}

			}, SCAN_CHECK_INTERVAL );
		} )
	},

	watchList: {
		save: ( req, user_profile ) => backend.patch( '/whoami', getToken( req ), { user_profile } ),
	},

	barriers: {
		getAll: async ( req, filters, page = 1, orderBy, orderDirection ) => {

			const params = getBarrierParams( filters, orderBy, orderDirection );

			addPagination( params, page );

			return backend.get( `/barriers?${ params.join( '&' ) }`, getToken( req ) );
		},
		download: ( req, filters, orderBy, orderDirection ) => {

			const params = getBarrierParams( filters, orderBy, orderDirection );

			return backend.raw.get( `/barriers/export?${ params.join( '&' ) }`, getToken( req ) );
		},
		get: ( req, barrierId ) => backend.get( `/barriers/${ barrierId }`, getToken( req ) ),
		getInteractions: ( req, barrierId ) => backend.get( `/barriers/${ barrierId }/interactions`, getToken( req ) ),
		getHistory: ( req, barrierId ) => backend.get( `/barriers/${ barrierId }/history`, getToken( req ) ),
		notes: {
			save: ( req, barrierId, values ) => backend.post( `/barriers/${ barrierId }/interactions`, getToken( req ), {
				text: values.note,
				documents: ( values.documentIds ? values.documentIds : null ),
			} ),
			update: ( req, noteId, values ) => backend.put( `/barriers/interactions/${ noteId }`, getToken( req ), {
				text: values.note,
				documents: values.documentIds
			} ),
			delete: ( req, noteId ) => backend.delete( `/barriers/interactions/${ noteId }`, getToken( req ) ),
		},
		setStatus: {
			unknown: ( req, barrierId, values ) => backend.put( `/barriers/${ barrierId }/unknown`, getToken( req ), {
				status_summary: values.unknownSummary
			} ),
			pending: ( req, barrierId, values ) => backend.put( `/barriers/${ barrierId }/open-action_required`, getToken( req ), {
				status_summary: values.pendingSummary,
				sub_status: values.pendingType,
				sub_status_other: getValue( values.pendingTypeOther ),
			} ),
			open: ( req, barrierId, values ) => backend.put( `/barriers/${ barrierId }/open-in-progress`, getToken( req ), {
				status_summary: values.reopenSummary
			} ),
			partResolved: ( req, barrierId, values ) => backend.put( `/barriers/${ barrierId }/resolve-in-part`, getToken( req ), {
				status_date: getDefaultedDate( values.partResolvedDate ),
				status_summary: values.partResolvedSummary
			} ),
			resolved: ( req, barrierId, values ) => backend.put( `/barriers/${ barrierId }/resolve-in-full`, getToken( req ), {
				status_date: getDefaultedDate( values.resolvedDate ),
				status_summary: values.resolvedSummary
			} ),
			hibernated: ( req, barrierId, values ) => backend.put( `/barriers/${ barrierId }/hibernate`, getToken( req ), {
				status_summary: values.hibernationSummary
			} ),
		},
		saveTypes: ( req, barrierId, types ) => updateBarrier( getToken( req ), barrierId, {
			barrier_types: getValue( types )
		} ),
		saveSectors: ( req, barrierId, sectors, allSectors ) => updateBarrier( getToken( req ), barrierId, {
			sectors: ( sectors && sectors.length ? sectors : null ),
			sectors_affected: ( sectors && sectors.length || allSectors ? true : false ),
			all_sectors: allSectors
		} ),
		saveLocation: ( req, barrierId, location ) => updateBarrier( getToken( req ), barrierId, {
			export_country: location.country,
			country_admin_areas: ( location.adminAreas && location.adminAreas.length ? location.adminAreas : [] )
		} ),
		saveCompanies: ( req, barrierId, companies ) => updateBarrier( getToken( req ), barrierId, {
			companies: ( companies && companies.length ? companies : null )
		} ),
		saveTitle: ( req, barrierId, values ) => updateBarrier( getToken( req ), barrierId, {
			barrier_title: values.title,
		} ),
		saveProduct: ( req, barrierId, values ) => updateBarrier( getToken( req ), barrierId, {
			product: values.product
		} ),
		saveDescription: ( req, barrierId, values ) => updateBarrier( getToken( req ), barrierId, {
			problem_description: values.description
		} ),
		saveSource: ( req, barrierId, values ) => updateBarrier( getToken( req ), barrierId, {
			source: values.source,
			other_source: getValue( values.sourceOther )
		} ),
		savePriority: ( req, barrierId, values ) => updateBarrier( getToken( req ), barrierId, {
			priority: values.priority,
			priority_summary: getValue( values.priorityDescription )
		} ),
		saveEuExitRelated: ( req, barrierId, values ) => updateBarrier( getToken( req ), barrierId, {
			eu_exit_related: values.euExitRelated,
		}),
		saveProblemStatus: ( req, barrierId, values ) => updateBarrier( getToken( req ), barrierId, {
			problem_status: values.problemStatus
		} ),
		saveStatus: ( req, barrierId, values ) => {

			const details = { status_summary: values.statusSummary };

			if( values.statusDate ){
				details.status_date = getDefaultedDate( values.statusDate );
			}

			return updateBarrier( getToken( req ), barrierId, details );
		},
		team: {
			get: ( req, barrierId ) => backend.get( `/barriers/${ barrierId }/members`, getToken( req ) ),
			add: ( req, barrierId, values ) => backend.post( `/barriers/${ barrierId }/members`, getToken( req ), {
				user: { profile: { sso_user_id: values.memberId } },
				role: values.role,
			} ),
			delete: ( req, barrierMemberId ) => backend.delete( `/barriers/members/${ barrierMemberId }`, getToken( req ) ),
		},
		assessment: (() => {

			function saveAssessmentValues( req, barrier, values ){

				const isPatch = barrier.has_assessment;
				const url = `/barriers/${ barrier.id }/assessment`;

				return backend[ ( isPatch ? 'patch' : 'post' ) ]( url, getToken( req ), values );
			}

			return {
				get: ( req, barrierId ) => backend.get( `/barriers/${ barrierId }/assessment`, getToken( req ) ),
				getHistory: ( req, barrierId ) => backend.get( `/barriers/${ barrierId }/assessment_history`, getToken( req ) ),
				saveEconomic: ( req, barrier, values ) => saveAssessmentValues( req, barrier, {
					impact: values.impact,
					explanation: values.description,
					documents: ( values.documentIds ? values.documentIds : null ),
				} ),
				saveEconomyValue: ( req, barrier, value ) => saveAssessmentValues( req, barrier,  {
					value_to_economy: value,
				} ),
				saveMarketSize: ( req, barrier, value ) => saveAssessmentValues( req, barrier,  {
					import_market_size: value,
				} ),
				saveExportValue: ( req, barrier, value ) => saveAssessmentValues( req, barrier,  {
					export_value: value,
				} ),
				saveCommercialValue: ( req, barrier, value ) => saveAssessmentValues( req, barrier,  {
					commercial_value: value,
				} ),
			};
		})(),
	},

	reports: {
		...reports,
		getAll: ( req ) => backend.get( '/reports?ordering=-created_on', getToken( req ) ).then( transformReportList ),
		getForCountry: ( req, countryId ) => backend.get( `/reports?export_country=${ countryId }&ordering=-created_on`, getToken( req ) ).then( transformReportList ),
		get: ( req, reportId ) => backend.get( `/reports/${ reportId }`, getToken( req ) ).then( transformSingleReport ),
		delete: ( req, reportId ) => backend.delete( `/reports/${ reportId }`, getToken( req ) ),
		save: ( req, values ) => backend.post( '/reports', getToken( req ), getInitialReportValues( values ) ),
		update: ( req, reportId, values ) => updateReport( getToken( req ), reportId, getInitialReportValues( values ) ),
		saveHasSectors: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
			sectors_affected: getValue( values.hasSectors ),
			all_sectors: null,
			sectors: null
		} ),
		saveSectors: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
			sectors: getValue( values.sectors ),
			all_sectors: getValue( values.allSectors ),
		} ),
		saveProblem: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
			product: getValue( values.item ),
			barrier_title: getValue( values.barrierTitle ),
			source: getValue( values.barrierSource ),
			other_source: getValue( values.barrierSourceOther ),
			eu_exit_related: getValue( values.euExitRelated ),
		} ),
		saveSummaryAndSubmit: async ( req, reportId, values ) => {

			const { response, body } = await reports.saveSummary( req, reportId, values );

			if( response.isSuccess ){

				return reports.submit( req, reportId );

			} else {

				return Promise.resolve( { response, body } );
			}
		},
	}
};
