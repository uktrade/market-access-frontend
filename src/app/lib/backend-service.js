const backend = require( './backend-request' );
const metadata = require( './metadata' );
const config = require( '../config' );
const logger = require( './logger' );

const SCAN_CHECK_INTERVAL = config.files.scan.statusCheckInterval;
const SCAN_MAX_ATTEMPTS = Math.round( config.files.scan.maxWaitTime / SCAN_CHECK_INTERVAL );

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
		'export_country': 'country',
		'sector': 'sector',
		'barrier_type': 'type',
		//'start_date': 'date-start',
		//'end_date': 'date-end',
	};

	const params = [];

	for( let [ paramKey, filterKey ] of Object.entries( filterMap ) ){

		const value = filters[ filterKey ];

		if( value ){

			params.push( `${ paramKey }=${ value }` );
		}
	}

	return params;
}

const reports = {
	saveProblem: ( req, reportId, values ) => updateReport( getToken( req ), reportId, {
		product: getValue( values.item ),
		problem_description: getValue( values.description ),
		barrier_title: getValue( values.barrierTitle ),
		source: getValue( values.barrierSource ),
		other_source: getValue( values.barrierSourceOther ),
		status_summary: getValue( values.resolvedDescription )
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

	barriers: {
		getAll: async ( req, filters = {} ) => {

			const params = getFilterParams( filters );
			let path = '/barriers';

			if( params.length ){

				path += '?' + params.join( '&' );
			}

			return backend.get( path, getToken( req ) );
		},
		get: ( req, barrierId ) => backend.get( `/barriers/${ barrierId }`, getToken( req ) ),
		getInteractions: ( req, barrierId ) => backend.get( `/barriers/${ barrierId }/interactions`, getToken( req ) ),
		getHistory: ( req, barrierId ) => backend.get( `/barriers/${ barrierId }/history`, getToken( req ) ),
		notes: {
			save: ( req, barrierId, values ) => backend.post( `/barriers/${ barrierId }/interactions`, getToken( req ), {
				text: values.note,
				pinned: ( values.pinned === 'true' ),
				documents: ( values.documentId ? [ values.documentId ] : null ),
			} ),
			update: ( req, noteId, values ) => backend.put( `/barriers/interactions/${ noteId }`, getToken( req ), {
				text: values.note
			} ),
		},
		resolve: ( req, barrierId, values ) => backend.put( `/barriers/${ barrierId }/resolve`, getToken( req ), {
			status_date: getDefaultedDate( values.resolvedDate ) + 'T00:00',
			status_summary: values.resolvedSummary
		} ),
		hibernate: ( req, barrierId, values ) => backend.put( `/barriers/${ barrierId }/hibernate`, getToken( req ), {
			status_summary: values.hibernationSummary
		} ),
		open: ( req, barrierId, values ) => backend.put( `/barriers/${ barrierId }/open`, getToken( req ), {
			status_summary: values.reopenSummary
		} ),
		saveType: ( req, barrierId, values, category ) => updateBarrier( getToken( req ), barrierId, {
			barrier_type: getValue( values.barrierType ),
			barrier_type_category: category
		} ),
		saveSectors: ( req, barrierId, sectors ) => updateBarrier( getToken( req ), barrierId, {
			sectors: ( sectors && sectors.length ? sectors : null )
		} ),
		saveCompanies: ( req, barrierId, companies ) => updateBarrier( getToken( req ), barrierId, {
			companies: ( companies && companies.length ? companies : null )
		} ),
		saveDetails: ( req, barrierId, values ) => updateBarrier( getToken( req ), barrierId, {
			barrier_title: values.title,
			export_country: values.country,
			problem_status: values.status
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
	},

	reports: {
		...reports,
		getAll: ( req ) => backend.get( '/reports', getToken( req ) ).then( transformReportList ),
		getForCountry: ( req, countryId ) => backend.get( `/reports?export_country=${ countryId }`, getToken( req ) ).then( transformReportList ),
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
		saveProblemAndSubmit: async ( req, reportId, values ) => {

			const { response, body } = await reports.saveProblem( req, reportId, values );

			if( response.isSuccess ){

				return reports.submit( req, reportId );

			} else {

				return Promise.resolve( { response, body } );
			}
		},
	}
};
