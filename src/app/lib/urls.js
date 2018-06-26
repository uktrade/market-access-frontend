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

const reportUrl = {
	index: () => '/report/',
	start: ( reportId ) => `/report/${ reportId ? reportId + '/' : '' }start/`,
	companySearch: ( reportId ) => `/report/${ reportId ? reportId + '/' : '' }company/`,
	companyDetails: ( companyId, reportId ) => `/report/${ reportId ? reportId + '/' : '' }company/${ companyId }/`,
	contacts: ( companyId, reportId ) => `/report/${ reportId ? reportId + '/' : '' }company/${ companyId }/contacts/`,
	viewContact: ( contactId, reportId ) => `/report/${ reportId ? reportId + '/' : '' }contact/${ contactId }/`,
	save: ( reportId ) => `/report/${ reportId ? reportId + '/' : '' }save/`,
	aboutProblem: ( reportId ) => `/report/${ reportId }/problem/`,
	nextSteps: ( reportId ) => `/report/${ reportId }/next-steps/`
};

module.exports = {

	index: () => '/',
	login: () => '/login/',

	report: reportUrl,

	nextReportStage: ( report ) => {

		const reportStage = getReportLastCompletedStage( report.progress );

		if( reportStage ){

			switch( reportStage.stage_code ){

				case '1.3':
					return reportUrl.aboutProblem( report.id );
				case '1.4':
					return reportUrl.nextSteps( report.id );
				default:
					return reportUrl.index();
			}
		}
	}
};
