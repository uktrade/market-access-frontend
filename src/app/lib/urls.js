module.exports = {

	index: () => '/',
	login: () => '/login/',

	report: {
		index: () => '/report/',
		start: ( barrierId ) => `/report/${ barrierId ? barrierId + '/' : '' }start/`,
		companySearch: ( barrierId ) => `/report/${ barrierId ? barrierId + '/' : '' }company/`,
		companyDetails: ( companyId, barrierId ) => `/report/${ barrierId ? barrierId + '/' : '' }company/${ companyId }/`,
		contacts: ( companyId, barrierId ) => `/report/${ barrierId ? barrierId + '/' : '' }company/${ companyId }/contacts/`,
		viewContact: ( contactId, barrierId ) => `/report/${ barrierId ? barrierId + '/' : '' }contact/${ contactId }/`,
		save: ( barrierId ) => `/report/${ barrierId ? barrierId + '/' : '' }save/`,
		aboutProblem: ( barrierId ) => `/report/${ barrierId }/problem/`
	}
};
