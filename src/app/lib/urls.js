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
const reportUrl = {
	index: () => '/report/',
	detail: ( reportId ) => `/report/${ reportId }/`,
	start: ( reportId ) => `/report/${ reportId ? reportId + '/' : '' }start/`,
	companySearch: ( reportId ) => `/report/${ reportId ? reportId + '/' : '' }company/`,
	companyDetails: ( companyId, reportId ) => `/report/${ reportId ? reportId + '/' : '' }company/${ companyId }/`,
	contacts: ( companyId, reportId ) => `/report/${ reportId ? reportId + '/' : '' }company/${ companyId }/contacts/`,
	viewContact: ( contactId, reportId ) => `/report/${ reportId ? reportId + '/' : '' }contact/${ contactId }/`,
	save: ( reportId ) => `/report/${ reportId ? reportId + '/' : '' }save/`,
	aboutProblem: ( reportId ) => `/report/${ reportId }/problem/`,
	impact: ( reportId ) => `/report/${ reportId }/impact/`,
	legal: ( reportId ) => `/report/${ reportId }/legal/`,
	type: ( reportId ) => `/report/${ reportId }/type/`,
	support: ( reportId ) => `/report/${ reportId }/support/`,
	nextSteps: ( reportId ) => `/report/${ reportId }/next-steps/`,
	submit: ( reportId ) => `/report/${ reportId }/submit/`,
	success: () => `/report/success/`
};

module.exports = {

	index: () => '/',
	login: () => '/login/',

	report: reportUrl,

	reportStage: ( stageCode, report ) => {

		switch( stageCode ){
			case '1.1':
				return reportUrl.start( report.id );
			case '1.2':
				return reportUrl.companyDetails( report.company_id, report.id );
			case '1.3':
				return reportUrl.viewContact( report.contact_id, report.id );
			case '1.4':
				return reportUrl.aboutProblem( report.id );
			case '1.5':
				return reportUrl.impact( report.id );
			case '1.6':
				return reportUrl.legal( report.id );
			case '1.7':
				return reportUrl.type( report.id );
			case '2.1':
				return reportUrl.support( report.id );
			case '2.2':
				return reportUrl.nextSteps( report.id );
			default:
				return reportUrl.detail( report.id );
		}
	}
};
