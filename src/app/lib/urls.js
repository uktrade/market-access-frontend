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
	hasSectors: ( reportId ) => `/reports/${ reportId }/has-sectors/`,
	sectors: ( reportId ) => `/reports/${ reportId }/sectors/`,
	addSector: ( reportId ) => `/reports/${ reportId }/sectors/add/`,
	removeSector: ( reportId ) => `/reports/${ reportId }/sectors/remove/`,
	aboutProblem: ( reportId ) => `/reports/${ reportId }/problem/`,
	summary: ( reportId ) => `/reports/${ reportId }/summary/`,
	submit: ( reportId ) => `/reports/${ reportId }/submit/`,
};

module.exports = {

	index: () => '/',
	login: () => '/login/',
	me: () => '/me',
	whatIsABarrier: () => '/what-is-a-barrier/',
	findABarrier: () => '/find-a-barrier/',

	documents: {
		download: ( documentId ) => `/documents/${ documentId }/download/`,
		getScanStatus: ( documentId ) => `/documents/${ documentId }/status/`,
		delete: ( documentId ) => `/documents/${ documentId }/delete/`,
	},

	barriers: {
		detail: ( barrierId ) => `/barriers/${ barrierId }/`,
		edit: {
			headlines: ( barrierId ) => `/barriers/${ barrierId }/edit/`,
			product: ( barrierId ) => `/barriers/${ barrierId }/edit/product/`,
			description: ( barrierId ) => `/barriers/${ barrierId }/edit/description/`,
			source: ( barrierId ) => `/barriers/${ barrierId }/edit/source/`,
			priority: ( barrierId ) => `/barriers/${ barrierId }/edit/priority/`,
			status: ( barrierId ) => `/barriers/${ barrierId }/edit/status/`,
		},
		notes: {
			add: ( barrierId ) => `/barriers/${ barrierId }/interactions/add-note/`,
			edit: ( barrierId, noteId ) => `/barriers/${ barrierId }/interactions/edit-note/${ noteId }/`,
			documents: {
				add: ( barrierId ) => `/barriers/${ barrierId }/interactions/documents/add/`,
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
		companies: {
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
