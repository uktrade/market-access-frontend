module.exports = {

	index: () => '/',
	login: () => '/login/',

	report: {
		index: () => '/report/',
		start: () => '/report/start/',
		company: ( companyId ) => `/report/company/${ companyId ? companyId + '/' : '' }`,
		saveNew: () => '/report/new/',
		contacts: ( barrierId, companyId ) => `/report/${ barrierId }/company/${ companyId }/contacts/`,
		viewContact: ( barrierId, contactId ) => `/report/${ barrierId }/contact/${ contactId }/`,
		saveContact: ( barrierId ) => `/report/${ barrierId }/save/contact/`,
		aboutProblem: ( barrierId ) => `/report/${ barrierId }/problem/`
	}
};
