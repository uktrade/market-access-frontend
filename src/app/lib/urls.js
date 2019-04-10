/*
function getReportLastCompletedStage( progress ){

	if( Array.isArray( progress ) ){

		let i = ( progress.length - 1 );
		let item;

		while( ( item = progress[ i-- ] ) ){

			if( item.status_id === 3 ){ // 3 === 'complete'

				return item;
			}
		}
	}
}
*/
function getReportPath( reportId ){
	return ( reportId ? reportId : 'new' );
}

const reportUrl = {
	index: () => '/reports/',
	detail: ( reportId ) => `/reports/${ reportId }/`,
	new: () => '/reports/new/',
	start: ( reportId ) => `/reports/${ getReportPath( reportId ) }/start/`,
	isResolved: ( reportId ) => `/reports/${ getReportPath( reportId ) }/is-resolved/`,
	country: ( reportId ) => `/reports/${ getReportPath( reportId ) }/country/`,
	hasAdminAreas: ( reportId, countryId ) => `/reports/${ getReportPath( reportId ) }/country/${ countryId }/has-admin-areas/`,
	adminAreas: {
		list: ( reportId, countryId ) => `/reports/${ getReportPath( reportId ) }/country/${ countryId }/admin-areas/`,
		add: ( reportId, countryId ) => `/reports/${ getReportPath( reportId ) }/country/${ countryId }/admin-areas/add/`,
		remove: ( reportId, countryId ) => `/reports/${ getReportPath( reportId ) }/country/${ countryId }/admin-areas/remove/`,
	},
	hasSectors: ( reportId ) => `/reports/${ reportId }/has-sectors/`,
	sectors: ( reportId ) => `/reports/${ reportId }/sectors/`,
	addSector: ( reportId ) => `/reports/${ reportId }/sectors/add/`,
	removeSector: ( reportId ) => `/reports/${ reportId }/sectors/remove/`,
	aboutProblem: ( reportId ) => `/reports/${ reportId }/problem/`,
	summary: ( reportId ) => `/reports/${ reportId }/summary/`,
	submit: ( reportId ) => `/reports/${ reportId }/submit/`,
};

function getParams( map ){

	const params = [];

	for( let [ key, value ] of Object.entries( map ) ){

		params.push( key + '=' + value );
	}

	return ( params.length ? '?' + params.join( '&' ) : '' );
}

module.exports = {

	index: () => '/',
	login: () => '/login/',
	me: () => '/me',
	whatIsABarrier: () => '/what-is-a-barrier/',
	findABarrier: ( params ) => '/find-a-barrier/' + ( params ? getParams( params ) : '' ),

	documents: {
		download: ( documentId ) => `/documents/${ documentId }/download/`,
	},

	barriers: {
		detail: ( barrierId ) => `/barriers/${ barrierId }/`,
		edit: {
			product: ( barrierId ) => `/barriers/${ barrierId }/edit/product/`,
			title: (barrierId) => `/barriers/${ barrierId }/edit/title/`,
			description: ( barrierId ) => `/barriers/${ barrierId }/edit/description/`,
			source: ( barrierId ) => `/barriers/${ barrierId }/edit/source/`,
			priority: ( barrierId ) => `/barriers/${ barrierId }/edit/priority/`,
			euExitRelated: (barrierId) => `/barriers/${barrierId}/edit/eu-exit-related/`,
			status: ( barrierId ) => `/barriers/${ barrierId }/edit/status/`,
		},
		documents: {
			add: ( barrierId ) => `/barriers/${ barrierId }/interactions/documents/add/`,
			cancel: ( barrierId ) => `/barriers/${ barrierId }/interactions/documents/cancel/`,
			delete: ( barrierId, documentId ) => `/barriers/${ barrierId }/interactions/documents/${ documentId }/delete/`,
		},
		notes: {
			add: ( barrierId ) => `/barriers/${ barrierId }/interactions/add-note/`,
			edit: ( barrierId, noteId ) => `/barriers/${ barrierId }/interactions/edit-note/${ noteId }/`,
			documents: {
				add: ( barrierId, noteId ) => `/barriers/${ barrierId }/interactions/notes/${ noteId }/documents/add/`,
				cancel: ( barrierId, noteId ) => `/barriers/${ barrierId }/interactions/notes/${ noteId }/documents/cancel/`,
				delete: ( barrierId, noteId, documentId ) => `/barriers/${ barrierId }/interactions/notes/${ noteId }/documents/${ documentId }/delete/`,
			},
		},
		status: ( barrierId ) => `/barriers/${ barrierId }/status/`,
		type: {
			category: ( barrierId ) => `/barriers/${ barrierId }/type/`,
			list: ( barrierId, category ) => `/barriers/${ barrierId }/type/${ category }/`
		},
		sectors: {
			edit: ( barrierId ) => `/barriers/${ barrierId }/sectors/edit/`,
			list: ( barrierId ) => `/barriers/${ barrierId }/sectors/`,
			add: ( barrierId ) => `/barriers/${ barrierId }/sectors/add/`,
			remove: ( barrierId ) => `/barriers/${ barrierId }/sectors/remove/`,
			new: ( barrierId ) => `/barriers/${ barrierId }/sectors/new/`,
		},
		location: {
			list: ( barrierId ) => `/barriers/${ barrierId }/location/`,
			edit: ( barrierId ) => `/barriers/${ barrierId }/location/edit/`,
			country: ( barrierId ) => `/barriers/${ barrierId }/location/country/`,
			adminAreas: {
				add: ( barrierId ) => `/barriers/${ barrierId }/location/admin-areas/`,
				remove: ( barrierId ) => `/barriers/${ barrierId }/location/admin-areas/remove/`,
			}
		},
		companies: {
			new: ( barrierId ) => `/barriers/${ barrierId }/companies/new/`,
			edit: ( barrierId ) => `/barriers/${ barrierId }/companies/edit/`,
			list: ( barrierId ) => `/barriers/${ barrierId }/companies/`,
			details: ( barrierId, companyId ) => `/barriers/${ barrierId }/companies/${ companyId }/`,
			search: ( barrierId ) => `/barriers/${ barrierId }/companies/search/`,
			remove: ( barrierId ) => `/barriers/${ barrierId }/companies/remove/`
		}
	},

	reports: reportUrl,

	reportStage: ( stageCode, report ) => {

		switch( stageCode ){
			case '1.1':
				return reportUrl.start( report.id );
			case '1.2':
				return reportUrl.country( report.id );
			case '1.3':
				return reportUrl.hasSectors( report.id );
			case '1.4':
				return reportUrl.aboutProblem( report.id );
			case '1.5':
				return reportUrl.summary( report.id );
			default:
				return reportUrl.detail( report.id );
		}
	}
};
