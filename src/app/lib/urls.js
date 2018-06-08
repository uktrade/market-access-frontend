module.exports = {

	index: () => '/',
	login: () => '/login/',

	report: {
		index: () => '/report/',
		start: () => '/report/start/',
		company: ( id ) => `/report/company/${ id ? id + '/' : '' }`,
		saveNew: () => '/report/new/',
		contacts: ( id ) => `/report/company/${ id }/contacts/`
	}
};
