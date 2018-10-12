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
	submit: ( reportId ) => `/reports/${ reportId }/submit/`,
	success: ( reportId ) => `/reports/${ reportId }/success/`
};

module.exports = {

	index: () => '/',
	login: () => '/login/',
	me: () => '/me',
	whatIsABarrier: () => '/what-is-a-barrier/',

	barriers: {
		detail: ( barrierId ) => `/barriers/${ barrierId }/`,
		interactions: ( barrierId ) => `/barriers/${ barrierId }/interactions/`,
		addNote: ( barrierId ) => `/barriers/${ barrierId }/interactions/add-note/`,
		status: ( barrierId ) => `/barriers/${ barrierId }/status/`,
		statusResolved: ( barrierId ) => `/barriers/${ barrierId }/status/resolved/`,
		statusHibernated: ( barrierId ) => `/barriers/${ barrierId }/status/hibernated/`,
		statusOpen: ( barrierId ) => `/barriers/${ barrierId }/status/open/`,
		type: {
			category: ( barrierId ) => `/barriers/${ barrierId }/type/`,
			list: ( barrierId, category ) => `/barriers/${ barrierId }/type/${ category }/`
		},
		sectors: {
			list: ( barrierId ) => `/barriers/${ barrierId }/sectors/`,
			add: ( barrierId ) => `/barriers/${ barrierId }/sectors/add/`,
			remove: ( barrierId ) => `/barriers/${ barrierId }/sectors/remove/`
		},
		companies: {
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
			default:
				return reportUrl.detail( report.id );
		}
	}
};
