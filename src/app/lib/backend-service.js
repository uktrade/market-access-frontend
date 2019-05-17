const backend = require( './backend-request' );
const metadata = require( './metadata' );
const config = require( '../config' );
const logger = require( './logger' );

const SCAN_CHECK_INTERVAL = config.files.scan.statusCheckInterval;
const SCAN_MAX_ATTEMPTS = Math.round( config.files.scan.maxWaitTime / SCAN_CHECK_INTERVAL );
const LOCATION = 'location';

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
	}
	if( config.assignDefaultCountry && !body.country ){

		body.country = metadata.countries && metadata.countries[ 1 ];
		logger.verbose( 'Assigning country to user ', body.country );
	}

	body.country = body.country || {};

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
	};

	const params = [];
	const locations = [];

	for( let [ filterKey, paramKey ] of Object.entries( filterMap ) ){

		const value = filters[ filterKey ];

		if( value ){

			if( paramKey === LOCATION ){

				locations.push( value );

			} else {

				params.push( `${ paramKey }=${ value }` );
			}
		}
	}

	if( locations.length ){

		params.push( `${ LOCATION }=${ locations }` );
	}

	return params;
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
		save: (req, user_profile) => backend.patch( '/whoami', getToken( req ), { user_profile })
	},

	barriers: {
		getAll: async ( req, filters = {}, orderBy = 'reported_on', orderDirection ) => {

			const params = getFilterParams( filters );

			params.push( `ordering=${ orderDirection === 'asc' ? '' :  '-' }${ orderBy }` );

			return backend.get( `/barriers?${ params.join( '&' ) }`, getToken( req ) );
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
		resolve: ( req, barrierId, values ) => backend.put( `/barriers/${ barrierId }/resolve`, getToken( req ), {
			status_date: getDefaultedDate( values.resolvedDate ),
			status_summary: values.resolvedSummary
		} ),
		hibernate: ( req, barrierId, values ) => backend.put( `/barriers/${ barrierId }/hibernate`, getToken( req ), {
			status_summary: values.hibernationSummary
		} ),
		open: ( req, barrierId, values ) => backend.put( `/barriers/${ barrierId }/open`, getToken( req ), {
			status_summary: values.reopenSummary
		} ),
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
			problem_status: values.status
		} ),
		saveStatus: ( req, barrierId, values ) => {
			const status_details = { status_summary: values.statusSummary };
			if (values.statusDate) {
				status_details.status_date = getDefaultedDate( values.statusDate );
			}
			return updateBarrier( getToken( req ), barrierId, status_details);
		}
	},

	reports: {
		...reports,
		getAll: ( req ) => backend.get( '/reports?ordering=-created_on', getToken( req ) ).then( transformReportList ),
		getForCountry: ( req, countryId ) => backend.get( `/reports?export_country=${ countryId }&ordering=-created_on`, getToken( req ) ).then( transformReportList ),
		get: ( req, reportId ) => backend.get( `/reports/${ reportId }`, getToken( req ) ).then( transformSingleReport ),
		delete: ( req, reportId ) => backend.delete( `/reports/${ reportId }`, getToken( req ) ),
		save: ( req, values ) => backend.post( '/reports', getToken( req ), {
			problem_status: getValue( values.status ),
			is_resolved: getValue( values.isResolved ),
			resolved_date: getValue( getDefaultedDate( values.resolvedDate ) ),
			export_country: getValue( values.country ),
			country_admin_areas: getValue(values.adminAreas)
		} ),
		update: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
			problem_status: getValue( values.status ),
			is_resolved: getValue( values.isResolved ),
			resolved_date: getValue( getDefaultedDate( values.resolvedDate ) ),
			export_country: getValue( values.country ),
			country_admin_areas: getValue( values.adminAreas )
		} ),
		saveHasSectors: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
			sectors_affected: getValue( values.hasSectors ),
			all_sectors: null,
			sectors: null
		} ),
		saveAllSectors: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
			all_sectors: getValue( values.allSectors ),
			sectors: null
		} ),
		saveSectors: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
			sectors: getValue( values.sectors )
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
