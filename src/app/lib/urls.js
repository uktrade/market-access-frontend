module.exports = {

	index: () => '/',
	login: () => '/login/',

	report: {
		index: () => '/report/',
		start: ( reportId ) => `/report/${ reportId ? reportId + '/' : '' }start/`,
		companySearch: ( reportId ) => `/report/${ reportId ? reportId + '/' : '' }company/`,
		companyDetails: ( companyId, reportId ) => `/report/${ reportId ? reportId + '/' : '' }company/${ companyId }/`,
		contacts: ( companyId, reportId ) => `/report/${ reportId ? reportId + '/' : '' }company/${ companyId }/contacts/`,
		viewContact: ( contactId, reportId ) => `/report/${ reportId ? reportId + '/' : '' }contact/${ contactId }/`,
		save: ( reportId ) => `/report/${ reportId ? reportId + '/' : '' }save/`,
		aboutProblem: ( reportId ) => `/report/${ reportId }/problem/`
	}
};
