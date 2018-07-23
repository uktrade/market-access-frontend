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
	companySearch: ( reportId ) => `/reports/${ getReportPath( reportId ) }/company/`,
	companyDetails: ( companyId, reportId ) => `/reports/${ getReportPath( reportId ) }/company/${ companyId }/`,
	contacts: ( companyId, reportId ) => `/reports/${ getReportPath( reportId ) }/company/${ companyId }/contacts/`,
	viewContact: ( contactId, reportId ) => `/reports/${ getReportPath( reportId ) }/contact/${ contactId }/`,
	save: ( reportId ) => `/reports/${ getReportPath( reportId ) }/save/`,
	aboutProblem: ( reportId ) => `/reports/${ reportId }/problem/`,
	impact: ( reportId ) => `/reports/${ reportId }/impact/`,
	legal: ( reportId ) => `/reports/${ reportId }/legal/`,
	type: ( reportId ) => `/reports/${ reportId }/type/`,
	support: ( reportId ) => `/reports/${ reportId }/support/`,
	nextSteps: ( reportId ) => `/reports/${ reportId }/next-steps/`,
	submit: ( reportId ) => `/reports/${ reportId }/submit/`,
	success: () => `/reports/new/success/`
};

module.exports = {

	index: () => '/',
	login: () => '/login/',

	barriers: {
		detail: ( barrierId ) => `/barriers/${ barrierId }/`,
		interactions: ( barrierId ) => `/barriers/${ barrierId }/interactions/`,
		addNote: ( barrierId ) => `/barriers/${ barrierId }/interactions/add-note/`
	},

	reports: reportUrl,

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
